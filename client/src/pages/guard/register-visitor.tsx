import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterVisitor() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    purpose: "",
    aadharId: "",
    hostId: "1", // Default to first host
    expectedDuration: "60"
  });

  // Simulated host data
  const hosts = [
    { id: 1, name: "Sarah Johnson", department: "Human Resources" },
    { id: 2, name: "David Lee", department: "Information Technology" },
    { id: 3, name: "Emma Davis", department: "Finance" },
    { id: 4, name: "Michael Brown", department: "Operations" }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast({
        title: "Visitor registered successfully",
        description: `${formData.name} has been registered and the host has been notified.`,
      });
      
      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        company: "",
        purpose: "",
        aadharId: "",
        hostId: "1",
        expectedDuration: "60"
      });
      setPhotoUrl(null);
    }, 1500);
  };

  const handleCapturePhoto = () => {
    // Simulate webcam capture
    setPhotoUrl("https://randomuser.me/api/portraits/men/32.jpg");
    
    toast({
      title: "Photo captured",
      description: "Visitor photo has been saved",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Register New Visitor</h1>
          <p className="text-gray-600">Add a new visitor to the system</p>
        </header>

        <div className="bg-white rounded-lg shadow-md border border-purple-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter visitor's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter email address (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter company name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadharId"
                    value={formData.aadharId}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter Aadhar ID number"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose of Visit <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter the purpose of the visit"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Host <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="hostId"
                    value={formData.hostId}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {hosts.map(host => (
                      <option key={host.id} value={host.id}>
                        {host.name} - {host.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="expectedDuration"
                    value={formData.expectedDuration}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter expected duration in minutes"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visitor Photo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-32 bg-gray-100 border rounded-lg overflow-hidden">
                      {photoUrl ? (
                        <img src={photoUrl} alt="Visitor" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No photo
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Capture Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !photoUrl}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? "Registering..." : "Register Visitor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}