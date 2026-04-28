import { useState } from "react";
import { Link, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetAdminStats, 
  useListUsers, 
  useListDownloads,
  useCreateBook,
  useDeleteBook,
  useListBooks,
  useListAdminFeedback
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { DEPARTMENTS } from "@/pages/Register";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Book, BookOpen, Download, Loader2, MessageSquare, Plus, 
  Trash2, Users, LayoutDashboard, FileText
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getGetAdminStatsQueryKey, getListBooksQueryKey,
  getListDownloadsQueryKey, getListUsersQueryKey,
  getListAdminFeedbackQueryKey
} from "@workspace/api-client-react";

const bookSchema = z.object({
  title: z.string().min(1, { message: "تکایە ناوی کتێب بنووسە" }),
  author: z.string().min(1, { message: "تکایە ناوی نووسەر بنووسە" }),
  description: z.string().optional().default(""),
  department: z.string().min(1, { message: "تکایە بەشێک هەڵبژێرە" }),
  pdfUrl: z.string().url({ message: "تکایە بەستەرێکی دروست بنووسە (بە http دەست پێبکات)" }),
});

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    return <Redirect to="/library" />;
  }

  const { data: stats, isLoading: isStatsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey(), enabled: !!user && user.role === "admin" }
  });
  
  const { data: recentDownloads, isLoading: isDownloadsLoading } = useListDownloads({
    query: { queryKey: getListDownloadsQueryKey(), enabled: !!user && user.role === "admin" }
  });
  
  const { data: users, isLoading: isUsersLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey(), enabled: !!user && user.role === "admin" }
  });

  const { data: books, isLoading: isBooksLoading } = useListBooks(undefined, {
    query: { queryKey: getListBooksQueryKey(), enabled: !!user && user.role === "admin" }
  });

  const { data: allFeedback, isLoading: isFeedbackLoading } = useListAdminFeedback({
    query: { queryKey: getListAdminFeedbackQueryKey(), enabled: !!user && user.role === "admin" }
  });

  const createBookMutation = useCreateBook();
  const deleteBookMutation = useDeleteBook();

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      department: "",
      pdfUrl: "",
    },
  });

  function onSubmitBook(values: z.infer<typeof bookSchema>) {
    createBookMutation.mutate({ data: values }, {
      onSuccess: () => {
        setIsAddBookOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({
          title: "کتێب زیادکرا",
          description: "کتێبە نوێیەکە بە سەرکەوتوویی بۆ سیستەمەکە زیادکرا.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "هەڵە روویدا",
          description: "نەتوانرا کتێبەکە زیاد بکرێت.",
        });
      }
    });
  }

  function handleDeleteBook(id: number) {
    if (confirm("دڵنیای لە سڕینەوەی ئەم کتێبە؟")) {
      deleteBookMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({
            title: "کتێب سڕایەوە",
            description: "کتێبەکە بە سەرکەوتوویی سڕایەوە.",
          });
        }
      });
    }
  }

  if (!user || user.role !== "admin") {
    return null; // Will redirect
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20 md:pb-0">
        <div className="flex items-center gap-3 pb-4 border-b border-border/50">
          <div className="h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">بەڕێوەبردن</h1>
            <p className="text-muted-foreground text-sm mt-1">ئامار و بەڕێوەبردنی کتێبخانە</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <BookOpen className="h-8 w-8 text-primary mb-3 opacity-80" />
              <p className="text-sm text-muted-foreground font-medium mb-1">کۆی کتێبەکان</p>
              <h3 className="text-3xl font-bold text-foreground">
                {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stats?.totalBooks || 0}
              </h3>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Download className="h-8 w-8 text-primary mb-3 opacity-80" />
              <p className="text-sm text-muted-foreground font-medium mb-1">کۆی دابەزاندن</p>
              <h3 className="text-3xl font-bold text-foreground">
                {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stats?.totalDownloads || 0}
              </h3>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Users className="h-8 w-8 text-primary mb-3 opacity-80" />
              <p className="text-sm text-muted-foreground font-medium mb-1">قوتابیان</p>
              <h3 className="text-3xl font-bold text-foreground">
                {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stats?.totalUsers || 0}
              </h3>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <MessageSquare className="h-8 w-8 text-primary mb-3 opacity-80" />
              <p className="text-sm text-muted-foreground font-medium mb-1">سەرنجەکان</p>
              <h3 className="text-3xl font-bold text-foreground">
                {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stats?.totalFeedback || 0}
              </h3>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="books" dir="rtl" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="books" className="rounded-lg text-sm sm:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">کتێبەکان</TabsTrigger>
            <TabsTrigger value="downloads" className="rounded-lg text-sm sm:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">دابەزاندنەکان</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg text-sm sm:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">قوتابیان</TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-lg text-sm sm:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">سەرنجەکان</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="mt-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-xl">بەڕێوەبردنی کتێبەکان</CardTitle>
                  <CardDescription>زیادکردن و سڕینەوەی کتێبەکان لە کتێبخانە</CardDescription>
                </div>
                
                <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" /> زیادکردنی کتێب
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>کتێبی نوێ</DialogTitle>
                      <DialogDescription>
                        زانیارییەکانی کتێبە نوێیەکە لێرە داخڵ بکە.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitBook)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                          <FormItem><FormLabel>ناوی کتێب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="author" render={({ field }) => (
                          <FormItem><FormLabel>نووسەر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="department" render={({ field }) => (
                          <FormItem>
                            <FormLabel>بەش</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                              <FormControl><SelectTrigger><SelectValue placeholder="هەڵبژێرە..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                {DEPARTMENTS.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="pdfUrl" render={({ field }) => (
                          <FormItem>
                            <FormLabel>بەستەری PDF</FormLabel>
                            <FormControl><Input {...field} dir="ltr" className="text-right" placeholder="https://..." /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel>پوختە (ئارەزوومەندانە)</FormLabel>
                            <FormControl><Textarea {...field} className="resize-none" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}/>
                        <Button type="submit" className="w-full mt-2" disabled={createBookMutation.isPending}>
                          {createBookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          پاشەکەوتکردن
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-right w-[300px]">کتێب</TableHead>
                        <TableHead className="text-right">بەش</TableHead>
                        <TableHead className="text-center">دابەزاندن</TableHead>
                        <TableHead className="text-left">کردار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isBooksLoading ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" /></TableCell></TableRow>
                      ) : books?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">هیچ کتێبێک نییە</TableCell></TableRow>
                      ) : (
                        books?.map((book) => (
                          <TableRow key={book.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[280px]">{book.title}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[280px]">{book.author}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="font-normal">{book.department.replace('بەشی ', '')}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant="secondary">{book.downloadCount}</Badge></TableCell>
                            <TableCell className="text-left">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteBook(book.id)}
                                disabled={deleteBookMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="downloads" className="mt-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">دوایین دابەزاندنەکان</CardTitle>
                <CardDescription>بەدواداچوون بۆ ئەو قوتابیانەی کتێب دادەبەزێنن</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-right">کتێب</TableHead>
                        <TableHead className="text-right">قوتابی</TableHead>
                        <TableHead className="text-right hidden md:table-cell">بەش / کۆد</TableHead>
                        <TableHead className="text-left">بەروار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isDownloadsLoading ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" /></TableCell></TableRow>
                      ) : recentDownloads?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">هیچ دابەزاندنێک تۆمار نەکراوە</TableCell></TableRow>
                      ) : (
                        recentDownloads?.map((dl) => (
                          <TableRow key={dl.id}>
                            <TableCell className="font-medium truncate max-w-[200px]">{dl.bookTitle}</TableCell>
                            <TableCell>{dl.userName}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-1 text-xs">
                                <span>{dl.userDepartment}</span>
                                <span className="text-muted-foreground font-mono">{dl.userBadgeCode}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-left text-muted-foreground text-sm" dir="ltr">
                              {format(new Date(dl.downloadedAt), "yyyy/MM/dd HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">قوتابییە تۆمارکراوەکان</CardTitle>
                <CardDescription>لیستی ئەو قوتابیانەی هەژماریان هەیە</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-right">ناو</TableHead>
                        <TableHead className="text-right">ناوی بەکارهێنەر</TableHead>
                        <TableHead className="text-right">بەش</TableHead>
                        <TableHead className="text-left">بەرواری تۆماربوون</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isUsersLoading ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" /></TableCell></TableRow>
                      ) : users?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">هیچ بەکارهێنەرێک نییە</TableCell></TableRow>
                      ) : (
                        users?.filter(u => u.role !== "admin").map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground" dir="ltr">{u.username}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal bg-muted/30">
                                {u.department}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-left text-muted-foreground text-sm" dir="ltr">
                              {format(new Date(u.createdAt), "yyyy/MM/dd")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">هەموو سەرنجەکان</CardTitle>
                <CardDescription>سەرنجی قوتابیان لەسەر کتێبەکان</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-right">کتێب</TableHead>
                        <TableHead className="text-right">قوتابی</TableHead>
                        <TableHead className="text-right hidden md:table-cell">بەش</TableHead>
                        <TableHead className="text-right">سەرنج</TableHead>
                        <TableHead className="text-left">بەروار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFeedbackLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" /></TableCell></TableRow>
                      ) : allFeedback?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">هیچ سەرنجێک تۆمار نەکراوە</TableCell></TableRow>
                      ) : (
                        allFeedback?.map((fb) => (
                          <TableRow key={fb.id}>
                            <TableCell className="font-medium max-w-[150px] truncate">{fb.bookTitle}</TableCell>
                            <TableCell>{fb.userName}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="font-normal">{fb.userDepartment.replace('بەشی ', '')}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[250px]">
                              <p className="truncate text-sm text-muted-foreground">{fb.content}</p>
                            </TableCell>
                            <TableCell className="text-left text-muted-foreground text-sm" dir="ltr">
                              {format(new Date(fb.createdAt), "yyyy/MM/dd HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}