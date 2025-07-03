"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Loader2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

// TypeScript types
export enum environment_type {
  DEV = "DEV",
  STAGING = "STAGING",
  PROD = "PROD",
  TEST = "TEST",
}

export interface killSwitchFlagConfig {
  flagKey: string;
  environments: environment_type[];
}

interface MyRequestBody {
  name: string;
  description: string;
  killSwitchKey: string;
  flags: killSwitchFlagConfig[];
}

const ENV_OPTIONS = [
  environment_type.DEV,
  environment_type.STAGING,
  environment_type.PROD,
  environment_type.TEST,
];

export default function CreateKillSwitchPage() {
  const router = useRouter();
  const [form, setForm] = useState<MyRequestBody>({
    name: "",
    description: "",
    killSwitchKey: "",
    flags: [],
  });
  const [isSubmitting] = useState(false);

  // Function to auto-generate killSwitchKey from name
  const generateKillSwitchKey = (name: string): string => {
    const baseKey = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Add 6-digit random suffix
    const suffix = Math.floor(100000 + Math.random() * 900000);
    return baseKey ? `${baseKey}-${suffix}` : `kill-switch-${suffix}`;
  };

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate killSwitchKey when name changes
      if (name === 'name') {
        updated.killSwitchKey = generateKillSwitchKey(value);
      }
      return updated;
    });
  };

  const addFlag = () => {
    setForm((prev) => ({
      ...prev,
      flags: [...prev.flags, { flagKey: "", environments: [] }],
    }));
  };

  const removeFlag = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      flags: prev.flags.filter((_, i) => i !== idx),
    }));
  };

  const updateFlagKey = (idx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      flags: prev.flags.map((flag, i) => (i === idx ? { ...flag, flagKey: value } : flag)),
    }));
  };

  const toggleEnvironment = (flagIdx: number, env: environment_type) => {
    setForm((prev) => ({
      ...prev,
      flags: prev.flags.map((flag, i) =>
        i === flagIdx
          ? {
              ...flag,
              environments: flag.environments.includes(env)
                ? flag.environments.filter((e) => e !== env)
                : [...flag.environments, env],
            }
          : flag
      ),
    }));
  };

  // Validation
  const validate = (): boolean => {
    if (!form.name.trim()) return false;
    if (!form.description.trim()) return false;
    if (!form.killSwitchKey.trim()) return false;
    if (!Array.isArray(form.flags) || form.flags.length === 0) return false;
    for (const flag of form.flags) {
      if (!flag.flagKey.trim()) return false;
      if (!Array.isArray(flag.environments) || flag.environments.length === 0) return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill all fields and add at least one flag with environments.");
      return;
    }
    
    const promise = (async () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/killSwitch`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create kill switch");
        const result = await res.json();
        if (result.success) {
            return result;
        } 
        throw new Error(result.message || "Failed to create kill switch");
    })();

    toast.promise(promise, {
      loading: 'Creating kill switch...',
      success: () => {
        router.push("/killSwitch");
        return 'Kill Switch created successfully!';
      },
      error: (err) => err.message || "Error creating kill switch"
    });
  };

  return (
    <>
    <Toaster />
    <div className="space-y-8">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-2xl">Create Kill Switch</CardTitle>
              <CardDescription>
                Fill in the details to create a new kill switch. You can map multiple flags and environments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter kill switch name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="killSwitchKey">Kill Switch Key (auto-generated)</Label>
                <Input
                  id="killSwitchKey"
                  name="killSwitchKey"
                  value={form.killSwitchKey}
                  readOnly
                  className="mt-1 bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
                  placeholder="Auto-generated from name with unique suffix"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Auto-generated from name with a unique 6-digit suffix. This key cannot be edited.
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Describe the purpose of this kill switch"
                  rows={3}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-medium text-gray-900">Flags</Label>
                  <Button type="button" onClick={addFlag} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Flag
                  </Button>
                </div>
                <div className="space-y-4">
                  {form.flags.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-600">No flags added. Click &quot;Add Flag&quot; to get started.</p>
                    </div>
                  )}
                  {form.flags.map((flag, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-900 font-medium">Flag {idx + 1}</Label>
                        <Button
                          type="button"
                          onClick={() => removeFlag(idx)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-sm">Flag Key</Label>
                        <Input
                          value={flag.flagKey}
                          onChange={e => updateFlagKey(idx, e.target.value)}
                          className="mt-1"
                          placeholder="Enter flag key"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Environments</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ENV_OPTIONS.map(env => (
                            <Button
                              key={env}
                              type="button"
                              size="sm"
                              variant={flag.environments.includes(env) ? "default" : "outline"}
                              onClick={() => toggleEnvironment(idx, env)}
                              className={flag.environments.includes(env)
                                ? ""
                                : ""
                              }
                            >
                              {env}
                            </Button>
                          ))}
                        </div>
                        {flag.environments.length === 0 && (
                          <p className="text-xs text-red-600 mt-1">Select at least one environment.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Kill Switch</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
    </>
  );
}
