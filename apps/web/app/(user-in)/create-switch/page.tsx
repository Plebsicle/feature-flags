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
import { Badge } from "@/components/ui/badge";
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
    flags: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        } else {
            throw new Error(result.message || "Failed to create kill switch");
        }
    })();

    toast.promise(promise, {
      loading: 'Creating kill switch...',
      success: (result) => {
        router.push("/killSwitch");
        return 'Kill Switch created successfully!';
      },
      error: (err) => err.message || "Error creating kill switch"
    });
  };

  return (
    <>
    <Toaster />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Create Kill Switch</CardTitle>
              <CardDescription className="text-neutral-400">
                Fill in the details to create a new kill switch. You can map multiple flags and environments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-neutral-300">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 bg-slate-800/40 border-slate-700/30 text-white"
                  placeholder="Enter kill switch name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-neutral-300">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1 bg-slate-800/40 border-slate-700/30 text-white"
                  placeholder="Describe the purpose of this kill switch"
                  rows={3}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-neutral-300 text-lg">Flags</Label>
                  <Button type="button" onClick={addFlag} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Flag
                  </Button>
                </div>
                <div className="space-y-4">
                  {form.flags.length === 0 && (
                    <p className="text-neutral-400 text-center py-4">No flags added. Click "Add Flag" to get started.</p>
                  )}
                  {form.flags.map((flag, idx) => (
                    <div key={idx} className="p-4 border border-slate-700/30 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-neutral-300">Flag {idx + 1}</Label>
                        <Button
                          type="button"
                          onClick={() => removeFlag(idx)}
                          size="sm"
                          variant="outline"
                          className="border-red-700 text-red-300 hover:bg-red-800/20"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-neutral-300 text-sm">Flag Key</Label>
                        <Input
                          value={flag.flagKey}
                          onChange={e => updateFlagKey(idx, e.target.value)}
                          className="mt-1 bg-slate-800/40 border-slate-700/30 text-white"
                          placeholder="Enter flag key"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-neutral-300 text-sm">Environments</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ENV_OPTIONS.map(env => (
                            <Button
                              key={env}
                              type="button"
                              size="sm"
                              variant={flag.environments.includes(env) ? "default" : "outline"}
                              onClick={() => toggleEnvironment(idx, env)}
                              className={flag.environments.includes(env)
                                ? "bg-blue-600 text-white border-0"
                                : "border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                              }
                            >
                              {env}
                            </Button>
                          ))}
                        </div>
                        {flag.environments.length === 0 && (
                          <p className="text-xs text-red-400 mt-1">Select at least one environment.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
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
