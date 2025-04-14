import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Device, insertDeviceSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMqttCommand } from "@/lib/mqtt";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { 
  PlusCircle, 
  Cpu, 
  Power, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Lock, 
  Unlock,
  Settings,
  Edit,
  Trash2,
  Search
} from "lucide-react";

type FormValues = z.infer<typeof insertDeviceSchema>;

export default function DevicesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { connected, sendCommand } = useMqttCommand();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: {
      name: "",
      type: "door",
      location: "",
      deviceId: "",
      active: true,
      config: {}
    },
  });
  
  // Reset form when dialog opens or editing device changes
  const resetForm = (device?: Device) => {
    if (device) {
      form.reset({
        name: device.name,
        type: device.type,
        location: device.location,
        deviceId: device.deviceId,
        active: device.active,
        config: device.config || {}
      });
    } else {
      form.reset({
        name: "",
        type: "door",
        location: "",
        deviceId: "",
        active: true,
        config: {}
      });
    }
  };
  
  // Fetch devices
  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to fetch devices",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  // Create device mutation
  const createDeviceMutation = useMutation({
    mutationFn: async (deviceData: FormValues) => {
      return await apiRequest("POST", "/api/devices", deviceData);
    },
    onSuccess: () => {
      toast({
        title: "Device added",
        description: "New device has been successfully added to the system.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add device",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  // Update device mutation
  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, deviceData }: { id: number; deviceData: Partial<Device> }) => {
      return await apiRequest("PATCH", `/api/devices/${id}`, deviceData);
    },
    onSuccess: () => {
      toast({
        title: "Device updated",
        description: "Device has been successfully updated.",
      });
      setEditingDevice(null);
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update device",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      return await apiRequest("DELETE", `/api/devices/${deviceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Device deleted",
        description: "Device has been successfully removed from the system.",
      });
      setDeviceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete device",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  // Send command to device
  const sendDeviceCommand = useMutation({
    mutationFn: async ({ deviceId, command, params }: { deviceId: string; command: string; params?: any }) => {
      return await apiRequest("POST", "/api/devices/command", {
        deviceId,
        command,
        params
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Command sent",
        description: `${variables.command.charAt(0).toUpperCase() + variables.command.slice(1)} command sent successfully to the device.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Command failed",
        description: (error as Error).message || "Failed to send command to the device.",
      });
    },
  });
  
  // Filter devices based on search and type
  const filteredDevices = devices
    ? devices
        .filter(device => {
          // Type filter
          if (typeFilter !== "all" && device.type !== typeFilter) {
            return false;
          }
          
          // Search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              device.name.toLowerCase().includes(searchLower) ||
              device.location.toLowerCase().includes(searchLower) ||
              device.deviceId.toLowerCase().includes(searchLower)
            );
          }
          
          return true;
        })
    : [];
  
  // Handle form submission for create/edit
  const onSubmit = (data: FormValues) => {
    if (editingDevice) {
      updateDeviceMutation.mutate({ id: editingDevice.id, deviceData: data });
    } else {
      createDeviceMutation.mutate(data);
    }
  };
  
  // Send command to device (lock/unlock/reboot)
  const handleDeviceCommand = (deviceId: string, command: string) => {
    sendDeviceCommand.mutate({ deviceId, command });
    
    // Also send direct MQTT command if connected
    if (connected) {
      sendCommand(deviceId, command);
    }
  };
  
  // Helper to check if device is online (last seen within 5 minutes)
  const isDeviceOnline = (device: Device) => {
    if (!device.lastSeen) return false;
    const lastSeen = new Date(device.lastSeen).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastSeen > fiveMinutesAgo;
  };
  
  // Group devices by type for the dashboard view
  const doorDevices = filteredDevices.filter(d => d.type === 'door');
  const scannerDevices = filteredDevices.filter(d => d.type === 'scanner');
  const otherDevices = filteredDevices.filter(d => d.type !== 'door' && d.type !== 'scanner');

  return (
    <Layout title="IoT Devices" subtitle="Manage connected devices and access control">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="dashboard" className="flex items-center">
              <Cpu className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Manage Devices
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Device
          </Button>
        </div>
        
        {/* Dashboard View */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doorDevices.length > 0 && (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="text-lg">Access Control Doors</CardTitle>
                  <CardDescription>All door devices in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doorDevices.map(device => (
                      <Card key={device.id} className="overflow-hidden">
                        <div className={`h-2 ${device.active && isDeviceOnline(device) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{device.name}</h3>
                            {device.active && isDeviceOnline(device) ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Offline</Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 mb-4">{device.location}</p>
                          
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDeviceCommand(device.deviceId, 'lock')}
                              disabled={!device.active || !isDeviceOnline(device)}
                            >
                              <Lock className="mr-1 h-4 w-4" />
                              Lock
                            </Button>
                            <Button 
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleDeviceCommand(device.deviceId, 'unlock')}
                              disabled={!device.active || !isDeviceOnline(device)}
                            >
                              <Unlock className="mr-1 h-4 w-4" />
                              Unlock
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {scannerDevices.length > 0 && (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="text-lg">ID Scanners</CardTitle>
                  <CardDescription>All scanner devices in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scannerDevices.map(device => (
                      <Card key={device.id} className="overflow-hidden">
                        <div className={`h-2 ${device.active && isDeviceOnline(device) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{device.name}</h3>
                            {device.active && isDeviceOnline(device) ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Offline</Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 mb-2">{device.location}</p>
                          
                          <div className="flex justify-end mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeviceCommand(device.deviceId, 'reboot')}
                              disabled={!device.active}
                            >
                              <RefreshCw className="mr-1 h-4 w-4" />
                              Reboot
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {otherDevices.length > 0 && (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="text-lg">Other Devices</CardTitle>
                  <CardDescription>Miscellaneous devices connected to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherDevices.map(device => (
                      <Card key={device.id} className="overflow-hidden">
                        <div className={`h-2 ${device.active && isDeviceOnline(device) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{device.name}</h3>
                            {device.active && isDeviceOnline(device) ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Offline</Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">{device.location}</p>
                          <p className="text-xs text-neutral-400 mt-1">Type: {device.type}</p>
                          
                          <div className="flex justify-end mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeviceCommand(device.deviceId, 'status')}
                              disabled={!device.active}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Status
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {filteredDevices.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="bg-neutral-100 rounded-full p-3 mb-4">
                    <Cpu className="h-8 w-8 text-neutral-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No devices found</h3>
                  <p className="text-neutral-500 text-center max-w-md mb-4">
                    {searchTerm || typeFilter !== "all" 
                      ? "No devices match your current search filters." 
                      : "You haven't added any IoT devices to the system yet."}
                  </p>
                  <Button onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(true);
                  }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Device
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* List View */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Devices</CardTitle>
              <CardDescription>
                Manage all IoT devices connected to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search devices..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="door">Door</SelectItem>
                    <SelectItem value="scanner">Scanner</SelectItem>
                    <SelectItem value="sensor">Sensor</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isLoading ? (
                <div className="py-8 text-center text-neutral-500">Loading devices...</div>
              ) : filteredDevices.length === 0 ? (
                <div className="py-8 text-center text-neutral-500">
                  No devices found matching the current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Location</th>
                        <th className="text-left py-3 px-4 font-medium">Device ID</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Last Seen</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.map(device => (
                        <tr key={device.id} className="border-b hover:bg-neutral-50">
                          <td className="py-3 px-4 font-medium">{device.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize">{device.type}</Badge>
                          </td>
                          <td className="py-3 px-4">{device.location}</td>
                          <td className="py-3 px-4 font-mono text-xs">{device.deviceId}</td>
                          <td className="py-3 px-4">
                            {device.active ? (
                              isDeviceOnline(device) ? (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                  <span className="text-green-600">Online</span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                  <span className="text-red-600">Offline</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-neutral-300 mr-2"></div>
                                <span className="text-neutral-500">Inactive</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {device.lastSeen 
                              ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })
                              : "Never"
                            }
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setEditingDevice(device);
                                  resetForm(device);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeviceToDelete(device)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create/Edit Device Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingDevice} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingDevice(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDevice ? "Edit Device" : "Add New Device"}</DialogTitle>
            <DialogDescription>
              {editingDevice 
                ? "Update device details and configuration"
                : "Add a new IoT device to the system"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Entrance Door" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
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
                        <SelectItem value="door">Door/Access Control</SelectItem>
                        <SelectItem value="scanner">ID Scanner</SelectItem>
                        <SelectItem value="camera">Camera</SelectItem>
                        <SelectItem value="sensor">Sensor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Reception Area" {...field} />
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
                    <FormLabel>Device ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="door-001" 
                        {...field} 
                        disabled={!!editingDevice}
                      />
                    </FormControl>
                    {editingDevice ? (
                      <FormDescription>
                        Device ID cannot be changed after creation
                      </FormDescription>
                    ) : (
                      <FormDescription>
                        Unique identifier used for communication with the device
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Device will be actively used in the system
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
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending}
                >
                  {editingDevice ? "Update Device" : "Add Device"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Device Dialog */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={(open) => {
        if (!open) setDeviceToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the device{" "}
              <span className="font-semibold">{deviceToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deviceToDelete) {
                  deleteDeviceMutation.mutate(deviceToDelete.id);
                }
              }}
              disabled={deleteDeviceMutation.isPending}
            >
              {deleteDeviceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
