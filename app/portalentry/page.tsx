"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, FileText, Zap, Lock, Globe } from "lucide-react"
import Link from "next/link"

export default function PortalEntryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-heading font-bold text-foreground mb-4">
            LegalCollab
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI-Assisted Legal Collaboration Platform for Streamlined Contract Negotiation and Document Generation
          </p>
        </div>

        {/* Project Overview */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-card/50 backdrop-blur-sm border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-heading">About LegalCollab</CardTitle>
              <CardDescription className="text-base">
                Revolutionizing legal document collaboration with intelligent AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-6 h-6 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">AI-Powered Clause Matching</h3>
                      <p className="text-sm text-muted-foreground">
                        Intelligent clause comparison and conflict resolution for faster negotiations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Dynamic Document Generation</h3>
                      <p className="text-sm text-muted-foreground">
                        Create professional legal documents with customizable templates
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Users className="w-6 h-6 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Real-time Collaboration</h3>
                      <p className="text-sm text-muted-foreground">
                        Seamless multi-party document editing and negotiation workflows
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Lock className="w-6 h-6 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Secure & Compliant</h3>
                      <p className="text-sm text-muted-foreground">
                        Enterprise-grade security with audit trails and compliance tracking
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Globe className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Trusted by legal professionals worldwide for efficient contract management and collaboration
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portal Selection */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center text-foreground mb-8">
            Choose Your Portal
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* User Portal */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-accent">
              <Link href="/login">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
                    <Users className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-heading text-foreground">User Portal</CardTitle>
                  <CardDescription className="text-base">
                    Access your legal collaboration workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                    <li>• Create and manage agreements</li>
                    <li>• Collaborate on documents</li>
                    <li>• Track negotiation progress</li>
                    <li>• Access AI-powered insights</li>
                  </ul>
                  <Button className="w-full group-hover:bg-accent group-hover:text-accent-foreground">
                    Enter User Portal
                  </Button>
                </CardContent>
              </Link>
            </Card>

            {/* Admin Portal */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-accent">
              <Link href="/admin/login">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
                    <Shield className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-2xl font-heading text-foreground">Admin Portal</CardTitle>
                  <CardDescription className="text-base">
                    Manage platform administration and oversight
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                    <li>• User management and approval</li>
                    <li>• Template and clause oversight</li>
                    <li>• System monitoring and logs</li>
                    <li>• Platform configuration</li>
                  </ul>
                  <Button variant="outline" className="w-full group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent">
                    Enter Admin Portal
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>© 2025LegalCollab. All rights reserved.</p>
          <p className="mt-2">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@legalcollab.com" className="text-accent hover:underline">
              support@legalcollab.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
