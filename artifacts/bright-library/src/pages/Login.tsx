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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(1, { message: "تکایە ناوی بەکارهێنەر بنووسە" }),
  password: z.string().min(1, { message: "تکایە تێپەڕەوشە بنووسە" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useLogin();

  function onSubmit(values: z.infer<typeof formSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast({
          title: "بە سەرکەوتوویی چوویتە ژوورەوە",
          description: "بەخێربێیت بۆ کتێبخانەی بڕایت",
        });
        setLocation("/library");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "هەڵە روویدا",
          description: error.data?.error || "ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە",
        });
      }
    });
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
            <CardDescription>
              بۆ بەکارهێنانی کتێبخانەی بڕایت، تکایە بچۆرە ژوورەوە
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-2">
          <p className="text-sm text-muted-foreground">
            هەژمارت نییە؟{" "}
            <Button variant="link" asChild className="p-0 h-auto font-semibold">
              <Link href="/register">خۆت تۆمار بکە</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}