"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, Archive } from "lucide-react";

export default function ManagePage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manage</h1>
          <p className="text-muted-foreground">
            Manage your documents, settings, and preferences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                View, organize, and manage all your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Archive className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Archived Analyses</CardTitle>
              <CardDescription>
                View your past analyses and saved reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
