import { Layout } from "@/components/layout/layout";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Bell, 
  Mail, 
  Shield,
  Database, 
  Clock, 
  Save
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [autoApproval, setAutoApproval] = useState(false);
  const [visitorSessionTimeout, setVisitorSessionTimeout] = useState("240");
  const [retentionPeriod, setRetentionPeriod] = useState("90");
  
  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    });
  };
  
  const handleSaveSystem = () => {
    toast({
      title: "System settings saved",
      description: "System settings have been updated successfully.",
    });
  };
  
  const handleSaveBackup = () => {
    toast({
      title: "Backup settings saved",
      description: "Backup settings have been updated.",
    });
  };

  return (
    <Layout title="System Settings" subtitle="Configure system preferences and options">
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center">
            <Database className="mr-2 h-4 w-4" />
            Backup & Retention
          </TabsTrigger>
        </TabsList>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how the system notifies users about visitors and events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal text-sm text-neutral-500">Send email notifications to hosts when visitors arrive</span>
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
                    <span>SMS Notifications</span>
                    <span className="font-normal text-sm text-neutral-500">Send SMS alerts for visitor approvals and check-ins</span>
                  </Label>
                  <Switch
                    id="sms-notifications"
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notification-timeout" className="flex flex-col space-y-1">
                    <span>Notification Timeout (minutes)</span>
                    <span className="font-normal text-sm text-neutral-500">How long to wait before sending a reminder</span>
                  </Label>
                  <Input
                    id="notification-timeout"
                    type="number"
                    className="w-20"
                    min="5"
                    max="60"
                    defaultValue="15"
                  />
                </div>
                
                {emailNotifications && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Email Template Customization</Label>
                    <div className="grid gap-4 mt-2">
                      <div>
                        <Label htmlFor="email-subject" className="text-sm">Subject Line</Label>
                        <Input
                          id="email-subject"
                          defaultValue="[VisitorMS] New visitor waiting for your approval"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email-footer" className="text-sm">Email Footer</Label>
                        <Input
                          id="email-footer"
                          defaultValue="This is an automated message from the Visitor Management System"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications} className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure core system behavior and functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="auto-approval" className="flex flex-col space-y-1">
                    <span>Auto-Approval for Known Visitors</span>
                    <span className="font-normal text-sm text-neutral-500">Automatically approve visitors who have visited before</span>
                  </Label>
                  <Switch
                    id="auto-approval"
                    checked={autoApproval}
                    onCheckedChange={setAutoApproval}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="visitor-session-timeout" className="flex flex-col space-y-1">
                    <span>Visitor Session Timeout (minutes)</span>
                    <span className="font-normal text-sm text-neutral-500">Auto check-out visitors after this duration of inactivity</span>
                  </Label>
                  <Input
                    id="visitor-session-timeout"
                    type="number"
                    className="w-20"
                    value={visitorSessionTimeout}
                    onChange={(e) => setVisitorSessionTimeout(e.target.value)}
                    min="30"
                    max="1440"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="device-timeout" className="flex flex-col space-y-1">
                    <span>IoT Device Heartbeat Timeout (seconds)</span>
                    <span className="font-normal text-sm text-neutral-500">Mark device as offline after this duration without heartbeat</span>
                  </Label>
                  <Input
                    id="device-timeout"
                    type="number"
                    className="w-20"
                    defaultValue="30"
                    min="10"
                    max="300"
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Label className="text-base">Business Hours</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="business-start" className="text-sm">Start Time</Label>
                      <Input
                        id="business-start"
                        type="time"
                        defaultValue="09:00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-end" className="text-sm">End Time</Label>
                      <Input
                        id="business-end"
                        type="time"
                        defaultValue="18:00"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSystem} className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save System Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security policies and access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="require-photo" className="flex flex-col space-y-1">
                    <span>Require Visitor Photo</span>
                    <span className="font-normal text-sm text-neutral-500">Make visitor photo mandatory for registration</span>
                  </Label>
                  <Switch
                    id="require-photo"
                    defaultChecked={true}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="require-id" className="flex flex-col space-y-1">
                    <span>Require ID Verification</span>
                    <span className="font-normal text-sm text-neutral-500">Make Aadhar ID mandatory for all visitors</span>
                  </Label>
                  <Switch
                    id="require-id"
                    defaultChecked={true}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="session-timeout" className="flex flex-col space-y-1">
                    <span>User Session Timeout (minutes)</span>
                    <span className="font-normal text-sm text-neutral-500">Automatically log out users after inactivity</span>
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    className="w-20"
                    defaultValue="30"
                    min="5"
                    max="120"
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Label className="text-base">Password Policy</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-password-length" className="text-sm">Minimum Password Length</Label>
                      <Input
                        id="min-password-length"
                        type="number"
                        className="w-20"
                        defaultValue="8"
                        min="6"
                        max="24"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-complexity" className="text-sm">Require Complex Passwords</Label>
                      <Switch id="password-complexity" defaultChecked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-expiry" className="text-sm">Password Expiry (days)</Label>
                      <Input
                        id="password-expiry"
                        type="number"
                        className="w-20"
                        defaultValue="90"
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Backup & Retention Settings */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Data Retention</CardTitle>
              <CardDescription>
                Configure data retention policies and backup settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="retention-period" className="flex flex-col space-y-1">
                    <span>Visitor Data Retention Period (days)</span>
                    <span className="font-normal text-sm text-neutral-500">How long to keep visitor data before automatic deletion</span>
                  </Label>
                  <Input
                    id="retention-period"
                    type="number"
                    className="w-20"
                    value={retentionPeriod}
                    onChange={(e) => setRetentionPeriod(e.target.value)}
                    min="30"
                    max="365"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="auto-backup" className="flex flex-col space-y-1">
                    <span>Automatic Database Backup</span>
                    <span className="font-normal text-sm text-neutral-500">Schedule regular backups of system data</span>
                  </Label>
                  <Switch
                    id="auto-backup"
                    defaultChecked={true}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="backup-frequency" className="flex flex-col space-y-1">
                    <span>Backup Frequency</span>
                    <span className="font-normal text-sm text-neutral-500">How often to create backups</span>
                  </Label>
                  <select
                    id="backup-frequency"
                    className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    defaultValue="daily"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t flex flex-col space-y-4">
                  <Label className="text-base">Manual Backup & Restore</Label>
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" className="w-full md:w-auto">
                      <Database className="mr-2 h-4 w-4" />
                      Create Manual Backup
                    </Button>
                    <p className="text-sm text-neutral-500">
                      Last backup: <span className="font-medium">Never</span>
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor="restore-file" className="text-sm mb-2 block">Restore from Backup</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="restore-file"
                        type="file"
                        className="max-w-md"
                      />
                      <Button variant="outline" disabled>Restore</Button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Warning: Restoring from backup will replace all current data
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveBackup} className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Retention Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
