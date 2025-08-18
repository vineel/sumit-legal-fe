"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Sparkles, Send, Users, Clock } from "lucide-react"

interface ConflictResolutionProps {
  unresolvedClauses: string[]
  comparisonResults: any[]
  sessionId: string
}

// Mock messages for the conflict resolution
const mockMessages = [
  {
    id: "1",
    sender: "Brad's Guitars",
    message:
      "I really need indefinite protection for our proprietary guitar designs and manufacturing processes. This is core IP that could be devastating if it leaks.",
    timestamp: "2 hours ago",
    isCurrentUser: false,
  },
  {
    id: "2",
    sender: "Meemer VC",
    message:
      "I understand your concern, but indefinite obligations create compliance challenges for our fund. Could we consider a hybrid approach with different terms for different types of information?",
    timestamp: "1 hour ago",
    isCurrentUser: true,
  },
  {
    id: "3",
    sender: "AI Assistant",
    message:
      "Based on similar negotiations, I suggest a dual-tier approach: 3 years for general business information, and indefinite protection for technical IP and trade secrets until they become public. This addresses both parties' core concerns.",
    timestamp: "45 minutes ago",
    isAI: true,
  },
]

export function ConflictResolution({ unresolvedClauses, comparisonResults, sessionId }: ConflictResolutionProps) {
  const [selectedClause, setSelectedClause] = useState(unresolvedClauses[0] || "")
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)
  const [showAISuggestion, setShowAISuggestion] = useState(false)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      sender: "Current User",
      message: newMessage,
      timestamp: "Just now",
      isCurrentUser: true,
    }

    setMessages([...messages, message])
    setNewMessage("")

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        sender: "AI Assistant",
        message: "I've analyzed your latest message. Here's a potential compromise that might work for both parties...",
        timestamp: "Just now",
        isAI: true,
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 2000)
  }

  const getAISuggestion = () => {
    return "Based on the conversation history and both parties' preferences, I recommend a hybrid confidentiality term: 'Confidentiality obligations shall remain in effect for three (3) years for general business information, and indefinitely for technical specifications, trade secrets, and proprietary processes until such information becomes publicly available through no breach of this Agreement.' This addresses Brad's need for IP protection while giving Meemer VC a clear timeline for most disclosures."
  }

  if (unresolvedClauses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">All Conflicts Resolved!</h3>
          <p className="text-muted-foreground mb-4">
            Great work! All clauses have been successfully matched or resolved through negotiation.
          </p>
          <Button>Generate Final Document</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Unresolved Clauses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Unresolved Clauses ({unresolvedClauses.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These clauses need negotiation between parties to reach agreement
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unresolvedClauses.map((clause) => (
              <div
                key={clause}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedClause === clause ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                }`}
                onClick={() => setSelectedClause(clause)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{clause}</h4>
                  <Badge variant="destructive">Unresolved</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Both parties have conflicting preferences that require discussion
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      {selectedClause && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resolving: {selectedClause}</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>2 parties active</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>Last activity: 45 min ago</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Suggestion */}
            {showAISuggestion && (
              <Alert>
                <Sparkles className="w-4 h-4" />
                <AlertDescription className="mt-2">
                  <strong>AI Suggestion:</strong> {getAISuggestion()}
                </AlertDescription>
              </Alert>
            )}

            {/* Messages */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.isAI
                        ? "bg-accent/10 border border-accent/20"
                        : message.isCurrentUser
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.isAI ? (
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Assistant
                          </span>
                        ) : (
                          message.sender
                        )}
                      </span>
                      <span className="text-xs opacity-70">{message.timestamp}</span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAISuggestion(!showAISuggestion)}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {showAISuggestion ? "Hide" : "Get"} AI Suggestion
                </Button>
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message to discuss this clause..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="gap-2">
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
