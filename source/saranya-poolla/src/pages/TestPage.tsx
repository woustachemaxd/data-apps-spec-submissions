import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestPage() {
  return (
    <div className="space-y-8 animate-in fade-in-5 slide-in-from-top-2 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
          ✅ Test Page Works!
        </h1>
        <p className="text-muted-foreground text-lg">If you can see this, the routing is working correctly.</p>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Test Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a test to verify that the page content is rendering properly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
