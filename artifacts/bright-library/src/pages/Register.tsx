import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { DEPARTMENTS } from "@/constants/departments";
export { DEPARTMENTS };

const formSchema = z.object({
  name: z.string().min(2, { message: "تکایە ناوێکی تەواو بنووسە" }),
  username: z.string().min(3, { message: "ناوی بەکارهێنەر دەبێت لانی کەم ٣ پیت بێت" }),
  password: z.string().min(6, { message: "تێپەڕەوشە دەبێت لانی کەم ٦ پیت بێت" }),
  department: z.string().min(1, { message: "تکایە بەشێک هەڵبژێرە" }),
  badgeCode: z.string().min(1, { message: "تکایە کۆدی باجەکەت بنووسە" }),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      department: "",
      badgeCode: "",
    },
  });

  const registerMutation = useRegister();

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setToken(data.token);
        toast({
          title: "هەژمارەکەت بە سەرکەوتوویی دروستکرا",
          description: "بەخێربێیت بۆ کتێبخانەی بڕایت",
        });
        setLocation("/library");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "هەڵە روویدا",
          description: error.data?.error || "نەتوانرا هەژمار دروست بکرێت",
        });
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img 
              src={`${import.meta.env.BASE_URL}bright-logo.jpg`} 
              alt="BRIGHT Logo" 
              className="h-16 w-auto rounded-lg shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">خۆتۆمارکردن</CardTitle>
            <CardDescription>
              بۆ بەکارهێنانی کتێبخانە، زانیارییەکانت پڕبکەرەوە
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ناوی سیانی</FormLabel>
                    <FormControl>
                      <Input placeholder="ناوی تەواوت..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ناوی بەکارهێنەر</FormLabel>
                    <FormControl>
                      <Input placeholder="بۆ چوونەژوورەوە بەکاریدەهێنیت..." {...field} dir="ltr" className="text-right" />
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
                      <Input type="password" placeholder="تێپەڕەوشەیەکی بەهێز..." {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بەش</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="بەشەکەت هەڵبژێرە..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="badgeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کۆدی باج</FormLabel>
                    <FormControl>
                      <Input placeholder="کۆدی سەر باجی قوتابی..." {...field} dir="ltr" className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                خۆتۆمارکردن
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-2">
          <p className="text-sm text-muted-foreground">
            پێشتر هەژمارت هەیە؟{" "}
            <Button variant="link" asChild className="p-0 h-auto font-semibold">
              <Link href="/">چوونە ژوورەوە</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}