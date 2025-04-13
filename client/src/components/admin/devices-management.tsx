import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertDeviceSchema, DeviceTypes } from "@shared/schema";
import { Box, Edit, Plus, Power, PowerOff } from "lucide-react";
import { mqttService } from "@/lib/mqtt";

export default function DevicesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const { toast } = useToast();
  
  // Fetch all devices
  const { data: devices = [], isLoading, refetch: refetchDevices } = useQuery({
    queryKey: ["/api/devices"],
  });
  
  const form = useForm<z.infer<typeof insertDeviceSchema>>({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: {
      name: "",
      deviceId: "",
      type: DeviceTypes.ENTRY,
      location: "",
      active: true,
      config: {},
    },
  });
  
  const editForm = useForm<any>({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: {
      name: "",
      deviceId: "",
      type: "",
      location: "",
      active: true,
      config: {},
    },
  });
  
  // Reset form when dialog opens/closes
  const openAddDialog = () => {
    form.reset();
    setIsAddDialogOpen(true);
  };
  
  const openEditDialog = (device: any) => {
    setSelectedDevice(device);
    editForm.reset({
      name: device.name,
      deviceId: device.deviceId,
      type: device.type,
      location: device.location,
      active: device.active,
      config: device.config || {},
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle form submission for adding a new device
  const onSubmit = async (data: z.infer<typeof insertDeviceSchema>) => {
    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create device");
      }
      
      await refetchDevices();
      setIsAddDialogOpen(false);
      
      toast({
        title: "Device Created",
        description: `Device ${data.name} has been created successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to Create Device",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission for editing a device
  const onEditSubmit = async (data: any) => {
    if (!selectedDevice) return;
    
    try {
      const response = await fetch(`/api/devices/${selectedDevice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update device");
      }
      
      await refetchDevices();
      setIsEditDialogOpen(false);
      
      toast({
        title: "Device Updated",
        description: `Device ${data.name} has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to Update Device",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Toggle device active status
  const toggleDeviceStatus = async (deviceId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !isActive }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update device status");
      }
      
      await refetchDevices();
      
      toast({
        title: "Device Status Updated",
        description: `Device has been ${!isActive ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Update Device Status",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Send command to device via MQTT
  const sendDeviceCommand = (deviceId: string, command: string) => {
    const topic = `device/${deviceId}/command`;
    const message = { 
      command, 
      timestamp: new Date().toISOString() 
    };
    
    // Connect to MQTT broker if needed
    if (!mqttService.isConnected()) {
      try {
        // Use environmental variable for MQTT broker URL or fallback to local
        const brokerUrl = process.env.MQTT_BROKER_URL || 'ws://broker.emqx.io:8083/mqtt';
        mqttService.connect(brokerUrl);
      } catch (error) {
        console.error("Failed to connect to MQTT broker:", error);
        toast({
          title: "MQTT Connection Failed",
          description: "Could not connect to MQTT broker",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Publish command
    const success = mqttService.publish(topic, message);
    
    if (success) {
      toast({
        title: "Command Sent",
        description: `${command} command sent to device ${deviceId}`,
      });
    } else {
      toast({
        title: "Command Failed",
        description: "Failed to send command to device",
        variant: "destructive",
      });
    }
  };
  
  // Format the last seen time
  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} days ago`;
    
    return lastSeenDate.toLocaleDateString();
  };
  
  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case DeviceTypes.ENTRY:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Entry</Badge>;
      case DeviceTypes.EXIT:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Exit</Badge>;
      case DeviceTypes.ACCESS:
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Access</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">IoT Devices Management</h2>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Device List</CardTitle>
          <CardDescription>Manage IoT devices for visitor access control</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <Box className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No devices found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Device
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device: any) => (
                    <TableRow key={device.id}>
                      <TableCell>{device.name}</TableCell>
                      <TableCell>{device.deviceId}</TableCell>
                      <TableCell>{getTypeBadge(device.type)}</TableCell>
                      <TableCell>{device.location}</TableCell>
                      <TableCell>
                        <Badge variant={device.active ? "default" : "outline"}>
                          {device.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatLastSeen(device.lastSeen)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => sendDeviceCommand(device.deviceId, 'ping')}
                            disabled={!device.active}
                          >
                            Ping
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(device)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant={device.active ? "destructive" : "outline"} 
                            size="sm"
                            onClick={() => toggleDeviceStatus(device.id, device.active)}
                          >
                            {device.active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Register a new IoT device for visitor access control
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter device name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device ID*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unique device ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for the device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select device type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DeviceTypes.ENTRY}>Entry</SelectItem>
                          <SelectItem value={DeviceTypes.EXIT}>Exit</SelectItem>
                          <SelectItem value={DeviceTypes.ACCESS}>Access</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter device location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Whether this device is active and can be used
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Device</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device information
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter device name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device ID*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unique device ID" {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Device ID cannot be changed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select device type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DeviceTypes.ENTRY}>Entry</SelectItem>
                          <SelectItem value={DeviceTypes.EXIT}>Exit</SelectItem>
                          <SelectItem value={DeviceTypes.ACCESS}>Access</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter device location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Whether this device is active and can be used
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Device</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
