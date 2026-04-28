import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useListBooks } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { DEPARTMENTS } from "@/constants/departments";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Library() {
  const { user } = useAuth();
  const [selectedDept, setSelectedDept] = useState<string>(user?.department || "");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: books, isLoading } = useListBooks({
    department: selectedDept === "all" ? undefined : selectedDept,
  });

  const filteredBooks = books?.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8 pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">کتێبخانەی ئەلیکترۆنی</h1>
            <p className="text-muted-foreground mt-1">کتێبەکان و سەرچاوەکانی خوێندن دابەزێنە</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="گەڕان بۆ کتێب..." 
              className="pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={selectedDept} onValueChange={setSelectedDept} dir="rtl" className="w-full">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="h-10 w-max min-w-full justify-start md:w-auto p-1 bg-muted/50">
              <TabsTrigger value="all" className="rounded-sm">هەموو بەشەکان</TabsTrigger>
              {DEPARTMENTS.map(dept => (
                <TabsTrigger key={dept} value={dept} className="rounded-sm">{dept}</TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden border-border/40 shadow-sm">
                <div className="aspect-[3/4] bg-muted/30 relative">
                  <Skeleton className="h-full w-full absolute inset-0 rounded-none" />
                </div>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredBooks?.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-1">هیچ کتێبێک نەدۆزرایەوە</h3>
            <p className="text-muted-foreground">لە ئێستادا ئەم بەشە هیچ کتێبێکی تێدا نییە</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks?.map(book => (
              <Card key={book.id} className="group overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 relative flex items-center justify-center p-6 border-b border-border/30">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : (
                    <div className="w-full h-full bg-white shadow-sm rounded-sm border border-border/40 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                      <div className="absolute top-0 w-full h-2 bg-secondary/80"></div>
                      <BookOpen className="h-12 w-12 text-primary/40 mb-3" />
                      <h3 className="font-bold text-sm line-clamp-3 leading-snug">{book.title}</h3>
                    </div>
                  )}
                  <Badge variant="secondary" className="absolute top-3 right-3 shadow-sm border-0 font-medium z-10">
                    {book.department}
                  </Badge>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2" title={book.title}>{book.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-4 gap-1">
                    <Download className="h-3 w-3" />
                    <span>{book.downloadCount} جار دابەزێنراوە</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 border-t border-border/30 mt-auto bg-muted/5">
                  <Button asChild className="w-full gap-2 shadow-none" variant="default">
                    <Link href={`/books/${book.id}`}>
                      <span>بینینی کتێب</span>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}