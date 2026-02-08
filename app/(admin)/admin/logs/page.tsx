import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, Clock } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">System Logs</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          View system activity and audit logs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Activity Logs
          </CardTitle>
          <CardDescription>
            Track system events and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              System logging functionality is planned for a future release. 
              This will include user activity logs, crawler run history, 
              and audit trails for administrative actions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Planned Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              User authentication events (login, logout, password changes)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Data source crawler run history and errors
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Admin action audit trail (role changes, configuration updates)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              API usage and rate limiting events
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Search query analytics and patterns
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
