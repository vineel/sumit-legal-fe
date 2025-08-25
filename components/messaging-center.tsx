"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  MessageSquare,
  Send,
  Bot,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Settings,
  Users,
  Zap,
  TrendingUp,
  FileText,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  sender: "brad" | "meemer" | "ai"
  content: string
  timestamp: Date
  type: "message" | "suggestion" | "system"
  isPrivate?: boolean
}

interface ClauseDiscussion {
  clauseName: string
  status: "active" | "resolved" | "pending"
  messages: Message[]
  lastActivity: Date
  participants: string[]
}

const mockDiscussions: ClauseDiscussion[] = [
  {
    clauseName: "Term of Confidentiality",
    status: "active",
    lastActivity: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    participants: ["Brad's Guitars", "Meemer VC"],
    messages: [
      {
        id: "1",
        sender: "brad",
        content:
          "I need indefinite protection for our proprietary guitar designs and manufacturing processes. These are core trade secrets that could severely damage our competitive position if disclosed.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: "message",
      },
      {
        id: "2",
        sender: "meemer",
        content:
          "I understand your concerns, but indefinite obligations create compliance challenges for our fund. Could we consider a tiered approach - longer terms for technical IP and standard terms for business information?",
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        type: "message",
      },
      {
        id: "3",
        sender: "ai",
        content:
          "Based on similar negotiations, a hybrid approach often works well: 'Confidentiality obligations shall remain in effect for three (3) years for general business information, and indefinitely for information that qualifies as trade secrets until such information enters the public domain through no fault of the Recipient.'",
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
        type: "suggestion",
      },
      {
        id: "4",
        sender: "brad",
        content: "That hybrid approach sounds reasonable. Can we add specific language about manufacturing processes?",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        type: "message",
      },
    ],
  },
]

export function MessagingCenter() {
  const [activeDiscussion, setActiveDiscussion] = useState<string>("Term of Confidentiality")
  const [newMessage, setNewMessage] = useState("")
  const [aiGuidanceMode, setAiGuidanceMode] = useState<"private" | "shared">("shared")
  const [showAiSuggestions, setShowAiSuggestions] = useState(true)
  const [resolutionProgress, setResolutionProgress] = useState(65)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentDiscussion = mockDiscussions.find((d) => d.clauseName === activeDiscussion)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentDiscussion?.messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentDiscussion) return

    const message: Message = {
      id: Date.now().toString(),
      sender: "brad",
      content: newMessage,
      timestamp: new Date(),
      type: "message",
    }

    currentDiscussion.messages.push(message)
    setNewMessage("")

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: generateContextualAIResponse(newMessage, currentDiscussion.clauseName),
        timestamp: new Date(),
        type: "suggestion",
      }
      currentDiscussion.messages.push(aiResponse)
      setResolutionProgress(Math.min(resolutionProgress + 5, 95))
    }, 2000)
  }

  const generateContextualAIResponse = (userMessage: string, clauseName: string) => {
    const responses = {
      "Term of Confidentiality": [
        "Based on your message, I recommend considering a tiered approach: 3 years for business information, indefinite for trade secrets. This balances protection with practical compliance.",
        "Industry analysis shows 73% of similar negotiations resolve with hybrid duration terms. Would you like me to draft specific language?",
        "Your concern about IP protection is valid. Consider adding specific carveouts for regulatory disclosures while maintaining core protections.",
      ],
      "Purpose of Disclosure": [
        "For investment due diligence, I suggest 'evaluation of potential business relationship' language that's broad enough for thorough review but specific enough to prevent misuse.",
        "Based on similar VC negotiations, adding 'and related advisory services' gives appropriate flexibility while maintaining boundaries.",
      ],
    }

    const clauseResponses = responses[clauseName as keyof typeof responses] || [
      "I've analyzed your message and can suggest several approaches that align with both parties' interests. Would you like specific language recommendations?",
    ]

    return clauseResponses[Math.floor(Math.random() * clauseResponses.length)]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-warning text-warning-foreground"
      case "resolved":
        return "bg-success text-success-foreground"
      case "pending":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSenderInfo = (sender: string) => {
    switch (sender) {
      case "brad":
        return { name: "Brad's Guitars", avatar: "BG", color: "bg-primary" }
      case "meemer":
        return { name: "Meemer VC", avatar: "MV", color: "bg-accent" }
      case "ai":
        return { name: "AI Assistant", avatar: "AI", color: "bg-chart-1" }
      default:
        return { name: "Unknown", avatar: "?", color: "bg-muted" }
    }
  }

  const getResolutionConfidence = () => {
    if (!currentDiscussion) return 0
    const messageCount = currentDiscussion.messages.length
    const aiSuggestions = currentDiscussion.messages.filter((m) => m.type === "suggestion").length
    return Math.min(messageCount * 10 + aiSuggestions * 15, 95)
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Messaging Center</h1>
              <p className="text-muted-foreground">AI-assisted resolution of unmatched clauses</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                className="gap-2"
              >
                {showAiSuggestions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                AI Suggestions
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Resolution Progress
                </CardTitle>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" />
                  {getResolutionConfidence()}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress value={resolutionProgress} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {resolutionProgress < 50
                  ? "Early stage negotiation"
                  : resolutionProgress < 80
                    ? "Making good progress"
                    : "Near resolution"}
              </p>
            </CardContent>
          </Card>

          {/* AI Guidance Mode */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Guidance Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs value={aiGuidanceMode} onValueChange={(v) => setAiGuidanceMode(v as "private" | "shared")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="private">Private Guidance</TabsTrigger>
                  <TabsTrigger value="shared">Shared Guidance</TabsTrigger>
                </TabsList>
                <div className="mt-3 text-sm text-muted-foreground">
                  {aiGuidanceMode === "private"
                    ? "AI suggestions are visible only to you and adapt to your specific preferences."
                    : "AI suggestions are visible to all parties and focus on finding mutual compromise."}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Discussion List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-heading">Active Discussions</CardTitle>
                <CardDescription className="text-xs">Unresolved clauses requiring negotiation</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {mockDiscussions.map((discussion) => (
                    <button
                      key={discussion.clauseName}
                      onClick={() => setActiveDiscussion(discussion.clauseName)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        activeDiscussion === discussion.clauseName ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm line-clamp-2">{discussion.clauseName}</h3>
                        <Badge className={`text-xs ${getStatusColor(discussion.status)}`}>{discussion.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {discussion.lastActivity.toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{discussion.participants.length} parties</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            {currentDiscussion ? (
              <Card className="h-[700px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading">{currentDiscussion.clauseName}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(currentDiscussion.status)}>{currentDiscussion.status}</Badge>
                        <span>•</span>
                        <span>{currentDiscussion.participants.join(", ")}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <FileText className="w-4 h-4" />
                        View Clause
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <CheckCircle className="w-4 h-4" />
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {currentDiscussion.messages.map((message) => {
                        const senderInfo = getSenderInfo(message.sender)
                        const isAi = message.sender === "ai"
                        const isSuggestion = message.type === "suggestion"

                        if (isSuggestion && !showAiSuggestions) return null

                        return (
                          <div key={message.id} className={`flex gap-3 ${isAi ? "bg-muted/30 p-3 rounded-lg" : ""}`}>
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className={`text-xs ${senderInfo.color} text-white`}>
                                {senderInfo.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{senderInfo.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                                {isSuggestion && (
                                  <Badge variant="outline" className="text-xs">
                                    <Lightbulb className="w-3 h-3 mr-1" />
                                    AI Suggestion
                                  </Badge>
                                )}
                                {message.isPrivate && (
                                  <Badge variant="secondary" className="text-xs">
                                    Private
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm leading-relaxed">{message.content}</div>
                              {isSuggestion && (
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent">
                                    Accept Suggestion
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-xs h-7">
                                    Modify
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-xs h-7">
                                    Request Alternative
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <Separator />

                  {/* Message Input */}
                  <div className="p-4">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Type your message to continue the negotiation..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="self-end">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>Press Enter to send, Shift+Enter for new line</span>
                      <span>{aiGuidanceMode === "private" ? "Private mode" : "Shared mode"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[700px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium">No Discussion Selected</h3>
                    <p className="text-sm text-muted-foreground">Choose a clause discussion from the sidebar</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {showAiSuggestions && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                AI Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Negotiation Pattern:</strong> Similar clauses are typically resolved with tiered duration
                    approaches in 73% of cases.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Compromise Opportunity:</strong> Consider adding specific carveouts for regulatory
                    compliance requirements.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Resolution Likelihood:</strong> Based on message sentiment analysis,{" "}
                    {getResolutionConfidence()}% chance of agreement within 3 exchanges.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
