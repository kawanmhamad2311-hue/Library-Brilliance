import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, User } from "lucide-react";

const studentSchema = z.object({
  username: z.string().min(1, { message: "تکایە ناوی بەکارهێنەر بنووسە" }),
  password: z.string().min(1, { message: "تکایە تێپەڕەوشە بنووسە" }),
});

const adminSchema = z.object({
  code: z.string().min(1, { message: "تکایە کۆدی ئەدمین بنووسە" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"student" | "admin">("student");

  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: { username: "", password: "" },
  });

  const adminForm = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { code: "" },
  });

  const loginMutation = useLogin();

  function onStudentSubmit(values: z.infer<typeof studentSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "بە سەرکەوتوویی چوویتە ژوورەوە", description: "بەخێربێیت بۆ کتێبخانەی بڕایت" });
        setLocation("/library");
      },
      onError: () => {
        toast({ variant: "destructive", title: "هەڵە روویدا", description: "ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە" });
      },
    });
  }

  function onAdminSubmit(values: z.infer<typeof adminSchema>) {
    loginMutation.mutate({ data: { username: "admin", password: values.code } }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "بە سەرکەوتوویی چوویتە ژوورەوە", description: "بەخێربێیت ئەدمین" });
        setLocation("/admin");
      },
      onError: () => {
        toast({ variant: "destructive", title: "کۆد هەڵەیە", description: "کۆدی ئەدمین هەڵەیە، دووبارە هەوڵ بدەرەوە" });
      },
    });
  }

  function switchMode(newMode: "student" | "admin") {
    setMode(newMode);
    studentForm.reset();
    adminForm.reset();
    loginMutation.reset();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img
              src={`${import.meta.env.BASE_URL}bright-logo.jpg`}
              alt="BRIGHT Logo"
              className="h-20 w-auto rounded-lg shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">چوونە ژوورەوە</CardTitle>
            <CardDescription>بۆ بەکارهێنانی کتێبخانەی بڕایت، تکایە بچۆرە ژوورەوە</CardDescription>
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => switchMode("student")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                mode === "student"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <User className="h-4 w-4" />
              خوێندکار
            </button>
            <button
              type="button"
              onClick={() => switchMode("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                mode === "admin"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              ئەدمین
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {mode === "student" ? (
            <Form {...studentForm}>
              <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                <FormField
                  control={studentForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناوی بەکارهێنەر</FormLabel>
                      <FormControl>
                        <Input placeholder="ناوی بەکارهێنەرەکەت..." {...field} className="text-right" dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={studentForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تێپەڕەوشە</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="تێپەڕەوشەکەت..." {...field} className="text-right" dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  چوونە ژوورەوە
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>کۆدی تایبەتی ئەدمین بنووسە</span>
                </div>
                <FormField
                  control={adminForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>کۆدی ئەدمین</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="کۆدەکەت بنووسە..." {...field} className="text-right" dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  چوونە ژوورەوە وەک ئەدمین
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        {mode === "student" && (
          <CardFooter className="flex justify-center border-t p-4 mt-2">
            <p className="text-sm text-muted-foreground">
              هەژمارت نییە؟{" "}
              <Button variant="link" asChild className="p-0 h-auto font-semibold">
                <Link href="/register">خۆت تۆمار بکە</Link>
              </Button>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
