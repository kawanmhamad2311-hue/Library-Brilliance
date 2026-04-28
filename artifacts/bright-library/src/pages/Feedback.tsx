import { Link } from "wouter";
import { useListFeedback } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Feedback() {
  const { data: feedbacks, isLoading } = useListFeedback();

  return (
    <Layout>
      <div className="space-y-8 pb-20 md:pb-0 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-border/50">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-primary">دیواری سەرنجەکان</h1>
          <p className="text-muted-foreground max-w-xl">
            نوێترین سەرنج و پرسیارەکانی قوتابیان دەربارەی کتێبەکانی کتێبخانە لێرەدا دەبینرێن
          </p>
        </div>

        <div className="space-y-5">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="border-border/40 shadow-sm">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-start">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-24 sm:hidden" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center hidden sm:flex">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-6 w-40 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : feedbacks?.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-1">هیچ سەرنجێک نییە</h3>
              <p className="text-muted-foreground">هێشتا هیچ کەسێک سەرنجی لەسەر کتێبەکان نەنووسیوە</p>
            </div>
          ) : (
            feedbacks?.map((feedback) => (
              <Card key={feedback.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-3 sm:items-start shrink-0">
                    <Avatar className="h-12 w-12 border border-border/50">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {feedback.userName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="sm:hidden">
                      <p className="font-semibold">{feedback.userName}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(feedback.createdAt), "yyyy/MM/dd")}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="hidden sm:flex justify-between items-center mb-1">
                      <span className="font-semibold text-foreground">{feedback.userName}</span>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        {format(new Date(feedback.createdAt), "yyyy/MM/dd - HH:mm")}
                      </span>
                    </div>
                    
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-4 rounded-xl border border-border/30">
                      {feedback.content}
                    </p>
                    
                    <div className="flex justify-end pt-1">
                      <Button variant="secondary" size="sm" asChild className="h-8 gap-1.5 text-xs bg-secondary/10 text-secondary-foreground hover:bg-secondary/20">
                        <Link href={`/books/${feedback.bookId}`}>
                          <BookOpen className="h-3 w-3" />
                          <span className="truncate max-w-[150px] sm:max-w-xs">{feedback.bookTitle}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}