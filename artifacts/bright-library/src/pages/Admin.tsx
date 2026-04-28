import { useState, useRef } from "react";
import { Link, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import type { Book } from "@workspace/api-client-react";
import { 
  useGetAdminStats, 
  useListUsers, 
  useListDownloads,
  useCreateBook,
  useDeleteBook,
  useUpdateBook,
  useListBooks,
  useListAdminFeedback,
  useGetUnreadNotificationsCount,
  useMarkAllNotificationsRead,
  useDeactivateUser,
  useReactivateUser,
  useDeleteUser,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { DEPARTMENTS } from "@/constants/departments";
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Book as BookIcon, BookOpen, Download, Loader2, MessageSquare, Plus, 
  Trash2, Users, LayoutDashboard, FileText, ImageIcon, Upload, X, CheckCircle,
  UserX, UserCheck, AlertTriangle, Pencil
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getGetAdminStatsQueryKey, getListBooksQueryKey,
  getListDownloadsQueryKey, getListUsersQueryKey,
  getListAdminFeedbackQueryKey,
  getGetUnreadNotificationsCountQueryKey,
} from "@workspace/api-client-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const bookSchema = z.object({
  title: z.string().min(1, { message: "تکایە ناوی کتێب بنووسە" }),
  author: z.string().min(1, { message: "تکایە ناوی نووسەر بنووسە" }),
  description: z.string().optional().default(""),
  department: z.string().min(1, { message: "تکایە بەشێک هەڵبژێرە" }),
  pdfUrl: z.string().min(1, { message: "تکایە فایلی PDF بارکە" }),
});

interface UploadState {
  file: File | null;
  objectPath: string | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export default function Admin() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);

  // Cover image state
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // PDF upload state (for add dialog)
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    objectPath: null,
    isUploading: false,
    progress: 0,
    error: null,
  });

  // Edit dialog state
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditBookOpen, setIsEditBookOpen] = useState(false);
  const [editCoverImageUrl, setEditCoverImageUrl] = useState<string | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [isUploadingEditCover, setIsUploadingEditCover] = useState(false);
  const editCoverFileInputRef = useRef<HTMLInputElement>(null);
  const editPdfFileInputRef = useRef<HTMLInputElement>(null);
  const [editUploadState, setEditUploadState] = useState<UploadState>({
    file: null,
    objectPath: null,
    isUploading: false,
    progress: 0,
    error: null,
  });

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

  const { data: unreadData } = useGetUnreadNotificationsCount({
    query: {
      queryKey: getGetUnreadNotificationsCountQueryKey(),
      enabled: !!user && user.role === "admin",
      refetchInterval: 30000,
    }
  });

  const unreadCount = unreadData?.count ?? 0;

  const markAllReadMutation = useMarkAllNotificationsRead();

  const createBookMutation = useCreateBook();
  const deleteBookMutation = useDeleteBook();
  const updateBookMutation = useUpdateBook();
  const deactivateUserMutation = useDeactivateUser();
  const reactivateUserMutation = useReactivateUser();
  const deleteUserMutation = useDeleteUser();

  const [deleteUserDialog, setDeleteUserDialog] = useState<{ id: number; name: string } | null>(null);

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

  const editForm = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      department: "",
      pdfUrl: "",
    },
  });

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch("/api/upload/cover", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setCoverImageUrl(data.url);
    } catch {
      toast({ variant: "destructive", title: "هەڵە روویدا", description: "نەتوانرا وێنەکە بارکرێت." });
      setCoverPreview(null);
    } finally {
      setIsUploadingCover(false);
    }
  }

  function resetCover() {
    setCoverImageUrl(null);
    setCoverPreview(null);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadState(prev => ({ ...prev, error: "تەنها فایلی PDF پەسەند دەکرێت" }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadState(prev => ({ ...prev, error: "قەبارەی فایل نابێت لە 50MB زیاتر بێت" }));
      return;
    }

    setUploadState({ file, objectPath: null, isUploading: true, progress: 10, error: null });

    try {
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: "application/pdf",
        }),
      });

      if (!urlRes.ok) {
        throw new Error("نەتوانرا بەستەری بارکردن بەدەستبهێنرێت");
      }

      const { uploadURL, objectPath } = await urlRes.json();

      setUploadState(prev => ({ ...prev, progress: 40 }));

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });

      if (!uploadRes.ok) {
        throw new Error("بارکردنی فایل سەرکەوتوو نەبوو");
      }

      setUploadState({ file, objectPath, isUploading: false, progress: 100, error: null });
      form.setValue("pdfUrl", objectPath, { shouldValidate: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "بارکردنی فایل سەرکەوتوو نەبوو";
      setUploadState(prev => ({ ...prev, isUploading: false, progress: 0, error: message }));
    }
  }

  function handleRemoveFile() {
    setUploadState({ file: null, objectPath: null, isUploading: false, progress: 0, error: null });
    form.setValue("pdfUrl", "", { shouldValidate: false });
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = "";
  }

  function onSubmitBook(values: z.infer<typeof bookSchema>) {
    createBookMutation.mutate({ data: { ...values, coverImage: coverImageUrl } }, {
      onSuccess: () => {
        setIsAddBookOpen(false);
        form.reset();
        resetCover();
        handleRemoveFile();
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

  function handleMarkAllRead() {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationsCountQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });
        toast({ title: "هەموو ئاگادارییەکان خوێندرانەوە" });
      },
    });
  }

  function handleToggleUserActive(id: number, currentlyActive: boolean) {
    const mutation = currentlyActive ? deactivateUserMutation : reactivateUserMutation;
    mutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({
          title: currentlyActive ? "ئەکاونت ناچالاک کرا" : "ئەکاونت چالاک کرا",
          description: currentlyActive
            ? "ئەم قوتابییە دیگەر ناتوانێت چوونەژوورەوە."
            : "ئەم قوتابییە دوبارە توانای چوونەژوورەوەی هەیە.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "هەڵە روویدا",
          description: "نەتوانرا ئەکاونتەکە گۆڕبێت.",
        });
      },
    });
  }

  function handleDeleteUser() {
    if (!deleteUserDialog) return;
    deleteUserMutation.mutate({ id: deleteUserDialog.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        setDeleteUserDialog(null);
        toast({
          title: "ئەکاونت سڕایەوە",
          description: "ئەکاونتی قوتابییەکە بە سەرکەوتوویی سڕایەوە.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "هەڵە روویدا",
          description: "نەتوانرا ئەکاونتەکە بسڕێتەوە.",
        });
      },
    });
  }

  function handleOpenEditBook(book: Book) {
    setEditingBook(book);
    editForm.reset({
      title: book.title,
      author: book.author,
      description: book.description ?? "",
      department: book.department,
      pdfUrl: book.pdfUrl,
    });
    setEditCoverImageUrl(book.coverImage ?? null);
    setEditCoverPreview(book.coverImage ?? null);
    setEditUploadState({ file: null, objectPath: null, isUploading: false, progress: 0, error: null });
    setIsEditBookOpen(true);
  }

  function handleCloseEditBook() {
    setIsEditBookOpen(false);
    setEditingBook(null);
    editForm.reset();
    setEditCoverImageUrl(null);
    setEditCoverPreview(null);
    setEditUploadState({ file: null, objectPath: null, isUploading: false, progress: 0, error: null });
    if (editPdfFileInputRef.current) editPdfFileInputRef.current.value = "";
    if (editCoverFileInputRef.current) editCoverFileInputRef.current.value = "";
  }

  async function handleEditCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditCoverPreview(URL.createObjectURL(file));
    setIsUploadingEditCover(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch("/api/upload/cover", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setEditCoverImageUrl(data.url);
    } catch {
      toast({ variant: "destructive", title: "هەڵە روویدا", description: "نەتوانرا وێنەکە بارکرێت." });
      setEditCoverPreview(editCoverImageUrl);
    } finally {
      setIsUploadingEditCover(false);
    }
  }

  function resetEditCover() {
    setEditCoverImageUrl(null);
    setEditCoverPreview(null);
    if (editCoverFileInputRef.current) editCoverFileInputRef.current.value = "";
  }

  async function handleEditFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setEditUploadState(prev => ({ ...prev, error: "تەنها فایلی PDF پەسەند دەکرێت" }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setEditUploadState(prev => ({ ...prev, error: "قەبارەی فایل نابێت لە 50MB زیاتر بێت" }));
      return;
    }

    setEditUploadState({ file, objectPath: null, isUploading: true, progress: 10, error: null });

    try {
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: "application/pdf" }),
      });
      if (!urlRes.ok) throw new Error("نەتوانرا بەستەری بارکردن بەدەستبهێنرێت");
      const { uploadURL, objectPath } = await urlRes.json();
      setEditUploadState(prev => ({ ...prev, progress: 40 }));
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!uploadRes.ok) throw new Error("بارکردنی فایل سەرکەوتوو نەبوو");
      setEditUploadState({ file, objectPath, isUploading: false, progress: 100, error: null });
      editForm.setValue("pdfUrl", objectPath, { shouldValidate: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "بارکردنی فایل سەرکەوتوو نەبوو";
      setEditUploadState(prev => ({ ...prev, isUploading: false, progress: 0, error: message }));
    }
  }

  function handleRemoveEditFile() {
    if (editingBook) {
      editForm.setValue("pdfUrl", editingBook.pdfUrl, { shouldValidate: true });
    }
    setEditUploadState({ file: null, objectPath: null, isUploading: false, progress: 0, error: null });
    if (editPdfFileInputRef.current) editPdfFileInputRef.current.value = "";
  }

  function onSubmitEditBook(values: z.infer<typeof bookSchema>) {
    if (!editingBook) return;
    updateBookMutation.mutate(
      { id: editingBook.id, data: { ...values, coverImage: editCoverImageUrl } },
      {
        onSuccess: () => {
          handleCloseEditBook();
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          toast({ title: "کتێب نوێکرایەوە", description: "زانیارییەکانی کتێبەکە بە سەرکەوتوویی نوێکرایەوە." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "هەڵە روویدا", description: "نەتوانرا کتێبەکە نوێبکرێتەوە." });
        },
      }
    );
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
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
            <TabsTrigger value="downloads" className="rounded-lg text-sm sm:text-base data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
              دابەزاندنەکان
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
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
                
                <Dialog open={isAddBookOpen} onOpenChange={(open) => {
                  setIsAddBookOpen(open);
                  if (!open) {
                    form.reset();
                    handleRemoveFile();
                    resetCover();
                  }
                }}>
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

                        {/* PDF Upload Field */}
                        <FormField control={form.control} name="pdfUrl" render={() => (
                          <FormItem>
                            <FormLabel>فایلی PDF</FormLabel>
                            <FormControl>
                              <div>
                                <input
                                  ref={pdfFileInputRef}
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={handleFileSelect}
                                  disabled={uploadState.isUploading}
                                />
                                {!uploadState.file ? (
                                  <button
                                    type="button"
                                    onClick={() => pdfFileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                                  >
                                    <Upload className="h-8 w-8" />
                                    <span className="text-sm font-medium">کلیک بکە بۆ هەڵبژاردنی فایل</span>
                                    <span className="text-xs">PDF · زیاتر نەبێت لە 50MB</span>
                                  </button>
                                ) : (
                                  <div className="border rounded-lg p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-5 w-5 text-primary shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" dir="ltr">{uploadState.file.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadState.file.size)}</p>
                                      </div>
                                      {!uploadState.isUploading && (
                                        <button
                                          type="button"
                                          onClick={handleRemoveFile}
                                          className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                    {uploadState.isUploading && (
                                      <div className="space-y-1">
                                        <Progress value={uploadState.progress} className="h-1.5" />
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          بارکردن...
                                        </p>
                                      </div>
                                    )}
                                    {uploadState.objectPath && !uploadState.isUploading && (
                                      <p className="text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        فایل بە سەرکەوتوویی بارکرا
                                      </p>
                                    )}
                                  </div>
                                )}
                                {uploadState.error && (
                                  <p className="text-xs text-destructive mt-1">{uploadState.error}</p>
                                )}
                              </div>
                            </FormControl>
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

                        {/* Cover Image Upload Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">وێنەی بەرگ (ئارەزوومەندانە)</label>
                          {coverPreview ? (
                            <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted/20 aspect-[3/2]">
                              <img src={coverPreview} alt="پێشبینی" className="w-full h-full object-cover" />
                              {isUploadingCover && (
                                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                              )}
                              {!isUploadingCover && (
                                <button type="button" onClick={resetCover}
                                  className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button type="button" onClick={() => coverFileInputRef.current?.click()}
                              className="w-full border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors">
                              <ImageIcon className="h-8 w-8 opacity-40" />
                              <span className="text-sm">کلیک بکە بۆ هەڵبژاردنی وێنە</span>
                              <span className="text-xs opacity-60">JPG, PNG, WebP · زۆرترین 5MB</span>
                            </button>
                          )}
                          <input
                            ref={coverFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleCoverFileChange}
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full mt-2"
                          disabled={createBookMutation.isPending || uploadState.isUploading || !uploadState.objectPath || isUploadingCover}
                        >
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
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="دەستکاری"
                                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleOpenEditBook(book)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteBook(book.id)}
                                  disabled={deleteBookMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    دوایین دابەزاندنەکان
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {unreadCount} نوێ
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>بەدواداچوون بۆ ئەو قوتابیانەی کتێب دادەبەزێنن</CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={handleMarkAllRead}
                    disabled={markAllReadMutation.isPending}
                  >
                    {markAllReadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    هەموویان خوێندەوە
                  </Button>
                )}
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
                          <TableRow key={dl.id} className={!dl.isRead ? "bg-primary/5 font-medium" : undefined}>
                            <TableCell className="font-medium truncate max-w-[200px]">
                              <div className="flex items-center gap-2">
                                {!dl.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                )}
                                {dl.bookTitle}
                              </div>
                            </TableCell>
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
                        <TableHead className="text-right hidden sm:table-cell">ناوی بەکارهێنەر</TableHead>
                        <TableHead className="text-right hidden md:table-cell">بەش</TableHead>
                        <TableHead className="text-right">دۆخ</TableHead>
                        <TableHead className="text-left">کردار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isUsersLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" /></TableCell></TableRow>
                      ) : users?.filter(u => u.role !== "admin").length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">هیچ بەکارهێنەرێک نییە</TableCell></TableRow>
                      ) : (
                        users?.filter(u => u.role !== "admin").map((u) => (
                          <TableRow key={u.id} className={!u.isActive ? "opacity-60" : undefined}>
                            <TableCell>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-xs text-muted-foreground font-mono sm:hidden" dir="ltr">{u.username}</div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground hidden sm:table-cell" dir="ltr">{u.username}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="font-normal bg-muted/30">
                                {u.department}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {u.isActive ? (
                                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 font-normal">چالاک</Badge>
                              ) : (
                                <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 font-normal">ناچالاک</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-left">
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={u.isActive ? "ناچالاک کردن" : "چالاک کردن"}
                                  className={u.isActive
                                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                  onClick={() => handleToggleUserActive(u.id, u.isActive)}
                                  disabled={deactivateUserMutation.isPending || reactivateUserMutation.isPending}
                                >
                                  {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="سڕینەوە"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteUserDialog({ id: u.id, name: u.name })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Delete user confirmation dialog */}
            <Dialog open={!!deleteUserDialog} onOpenChange={(open) => { if (!open) setDeleteUserDialog(null); }}>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    سڕینەوەی ئەکاونت
                  </DialogTitle>
                  <DialogDescription>
                    دڵنیایت لە سڕینەوەی ئەکاونتی{" "}
                    <span className="font-semibold text-foreground">{deleteUserDialog?.name}</span>؟
                    <br />
                    ئەم کردارە گەرانەوەی نییە و هەموو داتاکانی قوتابییەکە دەسڕێتەوە.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setDeleteUserDialog(null)}>
                    پاشگەزبوونەوە
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteUser}
                    disabled={deleteUserMutation.isPending}
                  >
                    {deleteUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 ml-2" />
                    )}
                    بەڵێ، بسڕەوە
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

      {/* Edit Book Dialog */}
      <Dialog open={isEditBookOpen} onOpenChange={(open) => { if (!open) handleCloseEditBook(); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>دەستکاریکردنی کتێب</DialogTitle>
            <DialogDescription>زانیارییەکانی کتێبەکە بگۆڕە.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEditBook)} className="space-y-4 pt-4">
              <FormField control={editForm.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>ناوی کتێب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={editForm.control} name="author" render={({ field }) => (
                <FormItem><FormLabel>نووسەر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={editForm.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>بەش</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                    <FormControl><SelectTrigger><SelectValue placeholder="هەڵبژێرە..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>

              {/* PDF Upload Field */}
              <FormField control={editForm.control} name="pdfUrl" render={() => (
                <FormItem>
                  <FormLabel>فایلی PDF</FormLabel>
                  <FormControl>
                    <div>
                      <input
                        ref={editPdfFileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleEditFileSelect}
                        disabled={editUploadState.isUploading}
                      />
                      {!editUploadState.file ? (
                        <button
                          type="button"
                          onClick={() => editPdfFileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                        >
                          <Upload className="h-6 w-6" />
                          <span className="text-sm font-medium">کلیک بکە بۆ گۆڕینی فایل</span>
                          {editingBook && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> فایلی ئێستا هەیە
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" dir="ltr">{editUploadState.file.name}</p>
                            </div>
                            {!editUploadState.isUploading && (
                              <button type="button" onClick={handleRemoveEditFile} className="text-muted-foreground hover:text-destructive transition-colors">
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {editUploadState.isUploading && (
                            <div className="space-y-1">
                              <Progress value={editUploadState.progress} className="h-1.5" />
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> بارکردن...
                              </p>
                            </div>
                          )}
                          {editUploadState.objectPath && !editUploadState.isUploading && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> فایلی نوێ ئامادەیە
                            </p>
                          )}
                        </div>
                      )}
                      {editUploadState.error && (
                        <p className="text-xs text-destructive mt-1">{editUploadState.error}</p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>پوختە (ئارەزوومەندانە)</FormLabel>
                  <FormControl><Textarea {...field} className="resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>

              {/* Cover Image Upload Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">وێنەی بەرگ (ئارەزوومەندانە)</label>
                {editCoverPreview ? (
                  <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted/20 aspect-[3/2]">
                    <img src={editCoverPreview} alt="پێشبینی" className="w-full h-full object-cover" />
                    {isUploadingEditCover && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    {!isUploadingEditCover && (
                      <button type="button" onClick={resetEditCover}
                        className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => editCoverFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors">
                    <ImageIcon className="h-8 w-8 opacity-40" />
                    <span className="text-sm">کلیک بکە بۆ هەڵبژاردنی وێنە</span>
                  </button>
                )}
                <input
                  ref={editCoverFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleEditCoverFileChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={updateBookMutation.isPending || editUploadState.isUploading || isUploadingEditCover}
              >
                {updateBookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                پاشەکەوتکردن
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
