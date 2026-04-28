import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetBook, 
  useDownloadBook, 
  useListFeedback, 
  useCreateFeedback 
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowRight, BookOpen, Download, ExternalLink, FileText, Loader2, MessageSquare, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getGetBookQueryKey, getListFeedbackQueryKey,
  GetBookQueryResult, ListFeedbackQueryResult
} from "@workspace/api-client-react";

export default function BookDetail() {
  const [, params] = useRoute("/books/:id");
  const bookId = Number(params?.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [feedbackContent, setFeedbackContent] = useState("");

  const { data: book, isLoading: isBookLoading } = useGetBook(bookId, {
    query: { queryKey: getGetBookQueryKey(bookId), enabled: !!bookId }
  });

  const { data: feedbacks, isLoading: isFeedbackLoading } = useListFeedback(
    { bookId },
    { query: { queryKey: getListFeedbackQueryKey({ bookId }), enabled: !!bookId } }
  );

  const downloadMutation = useDownloadBook();
  const feedbackMutation = useCreateFeedback();

  const isObjectStoragePdf = book?.pdfUrl?.startsWith("/objects/");

  const getPdfPreviewUrl = () => {
    const token = localStorage.getItem("token");
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
    return `/api/books/${bookId}/pdf?inline=true${tokenParam}`;
  };

  const handleDownload = () => {
    if (!book) return;
    
    downloadMutation.mutate({ id: book.id }, {
      onSuccess: async (data) => {
        const isStorageObject = data.pdfUrl.startsWith("/objects/");

        if (isStorageObject) {
          const token = localStorage.getItem("token");
          const response = await fetch(`/api/books/${book.id}/pdf`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!response.ok) {
            toast({
              variant: "destructive",
              title: "هەڵە روویدا",
              description: "نەتوانرا کتێبەکە دابەزێنرێت، تکایە دووبارە هەوڵبدەرەوە",
            });
            return;
          }
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `${book.title}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        } else {
          window.open(data.pdfUrl, "_blank");
        }
        
        queryClient.setQueryData<GetBookQueryResult>(
          getGetBookQueryKey(book.id),
          (old) => old ? { ...old, downloadCount: old.downloadCount + 1 } : old
        );
        
        toast({
          title: "کتێبەکە ئامادەیە",
          description: "دابەزاندنی کتێبەکە دەستی پێکرد",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "هەڵە روویدا",
          description: "نەتوانرا کتێبەکە دابەزێنرێت، تکایە دووبارە هەوڵبدەرەوە",
        });
      }
    });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim() || !book) return;

    feedbackMutation.mutate({ 
      data: { bookId: book.id, content: feedbackContent.trim() } 
    }, {
      onSuccess: (newFeedback) => {
        setFeedbackContent("");
        queryClient.setQueryData<ListFeedbackQueryResult>(
          getListFeedbackQueryKey({ bookId: book.id }),
          (old) => old ? [newFeedback, ...old] : [newFeedback]
        );
        toast({
          title: "سەرنجەکەت نێردرا",
          description: "سوپاس بۆ بەشداریکردنت",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "هەڵە روویدا",
          description: "نەتوانرا سەرنجەکەت بنێردرێت",
        });
      }
    });
  };

  if (isBookLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Button variant="ghost" disabled className="gap-2 w-max">
            <ArrowRight className="h-4 w-4" /> گەڕانەوە
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div>
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2 mb-6" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">ئەم کتێبە نەدۆزرایەوە</h2>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/library">گەڕانەوە بۆ کتێبخانە</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20 md:pb-0">
        <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/library">
            <ArrowRight className="h-4 w-4" /> 
            <span>گەڕانەوە بۆ کتێبخانە</span>
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <div className="aspect-[3/4] bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl flex items-center justify-center border border-border/40 shadow-sm relative overflow-hidden">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative bg-white shadow-md rounded-md border border-border/50 m-8">
                  <div className="absolute top-0 w-full h-3 bg-secondary/80"></div>
                  <BookOpen className="h-16 w-16 text-primary/30 mb-4" />
                  <h3 className="font-bold text-xl line-clamp-4 leading-snug">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{book.author}</p>
                </div>
              )}
            </div>
            
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <Button 
                  size="lg" 
                  className="w-full gap-2 text-base h-12" 
                  onClick={handleDownload}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                  <span>دابەزاندنی کتێب</span>
                </Button>
                
                <div className="flex items-center justify-between text-sm pt-4 border-t border-border/50">
                  <span className="text-muted-foreground">ژمارەی دابەزاندن:</span>
                  <span className="font-semibold px-2 py-1 bg-muted rounded-md">{book.downloadCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Details and Feedback */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">{book.department}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight">{book.title}</h1>
              <div className="flex items-center gap-2 text-lg text-muted-foreground">
                <FileText className="h-5 w-5" />
                <span>نووسەر: <span className="font-medium text-foreground">{book.author}</span></span>
              </div>
              
              <div className="pt-6 border-t border-border/40 mt-6">
                <h3 className="text-lg font-semibold mb-3">پوختەی کتێب</h3>
                <p className="text-muted-foreground leading-relaxed text-justify whitespace-pre-wrap">
                  {book.description || "هیچ زانیارییەک بۆ ئەم کتێبە نەنووسراوە."}
                </p>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-primary">خوێندنەوەی کتێب</h2>
              </div>

              {isObjectStoragePdf ? (
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm bg-muted/5">
                    <iframe
                      src={getPdfPreviewUrl()}
                      title={book.title}
                      className="w-full"
                      style={{ height: "75vh", minHeight: "500px" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    ئەگەر پڕەکە نەیهات، پشافووری تۆ ممکنە PDF نەیخوێنێتەوە. دوگمەی دابەزاندن بەکاربهێنە.
                  </p>
                </div>
              ) : (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                    <ExternalLink className="h-10 w-10 text-primary/40" />
                    <p className="text-muted-foreground">ئەم کتێبە لە ماڵپەڕێکی دەرەکی پاراستراوە.</p>
                    <Button asChild variant="outline" className="gap-2">
                      <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        <span>کتێبەکە لە تابێکی نوێ بخوێنەوە</span>
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="pt-8 space-y-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-primary">سەرنجەکان</h2>
              </div>

              {/* Feedback Form */}
              <Card className="border-border/50 bg-muted/10 shadow-none">
                <CardContent className="p-4 md:p-6">
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 border border-border/50 hidden sm:block">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {user?.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <Textarea 
                          placeholder="سەرنج یان پرسیارێک بنووسە دەربارەی ئەم کتێبە..." 
                          className="min-h-[100px] resize-none border-border/50 focus-visible:ring-primary/30"
                          value={feedbackContent}
                          onChange={(e) => setFeedbackContent(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={!feedbackContent.trim() || feedbackMutation.isPending}
                            className="gap-2 px-6"
                          >
                            {feedbackMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span>ناردن</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Feedback List */}
              <div className="space-y-4 pt-4">
                {isFeedbackLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="border-border/40 shadow-sm">
                      <CardContent className="p-4 flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : feedbacks?.length === 0 ? (
                  <div className="text-center py-10 bg-muted/10 rounded-xl border border-border/40 border-dashed">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">تا ئێستا هیچ سەرنجێک نەنووسراوە. بە یەکەم کەس بنووسە!</p>
                  </div>
                ) : (
                  feedbacks?.map((feedback) => (
                    <Card key={feedback.id} className="border-border/50 shadow-sm overflow-hidden">
                      <CardContent className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                        <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                          <AvatarFallback className="bg-primary/5 text-primary font-medium text-sm">
                            {feedback.userName.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-semibold text-sm sm:text-base truncate">{feedback.userName}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(feedback.createdAt), "yyyy/MM/dd")}
                            </span>
                          </div>
                          <p className="text-sm sm:text-base text-foreground leading-relaxed break-words whitespace-pre-wrap">
                            {feedback.content}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
