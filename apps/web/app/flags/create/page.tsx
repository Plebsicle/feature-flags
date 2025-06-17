
import React, { useState } from 'react';
import { 
  Flag, 
  Plus, 
  Settings, 
  Target, 
  Zap,
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
import {flag_type} from '@repo/db/client'

const CreateFlagForm = () => {
  const [formData, setFormData] = useState({
    flagName: '',
    key: '',
    flagDescription: '',
    flag_type: 'BOOLEAN',
    environment: 'DEV',
    ruleName: '',
    ruleDescription: '',
    conditions: {},
    value: null as any,
    default_value: null as any,
    rollout_type: 'PERCENTAGE',
    rollout_config: { percentage: 0 },
    tags: [] as string[]
  });

  const [customAttributes, setCustomAttributes] = useState<Array<{name: string; operator: string; value: string; type: string}>>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');

  // Initialize default values based on flag type
  const initializeDefaultValues = (flagType : flag_type) => {
    switch (flagType) {
      case 'BOOLEAN':
        return { value: true, default_value: false };
      case 'STRING':
        return { value: '', default_value: '' };
      case 'NUMBER':
        return { value: 0, default_value: 0 };
      case 'JSON':
        return { value: {}, default_value: {} };
      case 'AB_TEST':
        return { value: { variant_a: 'A', variant_b: 'B' }, default_value: { variant_a: 'A' } };
      case 'MULTIVARIATE':
        return { value: { variants: ['A', 'B', 'C'] }, default_value: { variants: ['A'] } };
      default:
        return { value: null, default_value: null };
    }
  };

  const handleInputChange = (field : any, value : any) => {
    if (field === 'flag_type') {
      const defaults = initializeDefaultValues(value);
      setFormData(prev => ({
        ...prev,
        [field]: value,
        ...defaults
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleValueChange = (field : any, value : any) => {
    try {
      // Try to parse as JSON for complex types
      if (formData.flag_type === 'JSON' || formData.flag_type === 'AB_TEST' || formData.flag_type === 'MULTIVARIATE') {
        const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
        setFormData(prev => ({
          ...prev,
          [field]: parsedValue
        }));
      } else if (formData.flag_type === 'NUMBER') {
        setFormData(prev => ({
          ...prev,
          [field]: Number(value)
        }));
      } else if (formData.flag_type === 'BOOLEAN') {
        setFormData(prev => ({
          ...prev,
          [field]: value === 'true' || value === true
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } catch (error) {
      // If JSON parsing fails, keep as string
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addCustomAttribute = () => {
    setCustomAttributes(prev => [...prev, { name: '', operator: 'EQUALS', value: '', type: 'STRING' }]);
  };

  const removeCustomAttribute = (index : number) => {
    setCustomAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomAttribute = (index : number, field : any, value:any) => {
    setCustomAttributes(prev => prev.map((attr, i) => 
      i === index ? { ...attr, [field]: value } : attr
    ));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove : any) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const buildConditions = () => {
    const conditions = {};
    
    customAttributes.forEach(attr => {
      if (attr.name && attr.value) {
        conditions[attr.name] = {
          operator: attr.operator,
          value: attr.type === 'NUMBER' ? Number(attr.value) : attr.value,
          type: attr.type
        };
      }
    });

    return conditions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const conditions = buildConditions();
      
      const payload = {
        ...formData,
        conditions,
        key: formData.key || formData.flagName.toLowerCase().replace(/\s+/g, '_')
      };

      const response = await fetch(`${BACKEND_URL}/flag/createFlag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This ensures cookies are sent
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setSubmitMessage('Feature flag created successfully!');
        // Reset form
        setFormData({
          flagName: '',
          key: '',
          flagDescription: '',
          flag_type: 'BOOLEAN',
          environment: 'DEV',
          ruleName: '',
          ruleDescription: '',
          conditions: {},
          value: true,
          default_value: false,
          rollout_type: 'PERCENTAGE',
          rollout_config: { percentage: 0 },
          tags: []
        });
        setCustomAttributes([]);
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.message || 'Failed to create feature flag');
      }
    } catch (error) {
      console.error('Error creating flag:', error);
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderValueInput = (field, value) => {
    const baseClasses = "w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200";
    
    switch (formData.flag_type) {
      case 'BOOLEAN':
        return (
          <select
            value={value?.toString() || 'false'}
            onChange={(e) => handleValueChange(field, e.target.value === 'true')}
            className={baseClasses}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'NUMBER':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className={baseClasses}
            placeholder="Enter number"
          />
        );
      case 'STRING':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className={baseClasses}
            placeholder="Enter string value"
          />
        );
      case 'JSON':
      case 'AB_TEST':
      case 'MULTIVARIATE':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || '{}'}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className={`${baseClasses} h-24 resize-none font-mono text-sm`}
            placeholder="Enter JSON object"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(field, e.target.value)}
            className={baseClasses}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create Feature Flag</h1>
          <p className="text-neutral-400 text-base sm:text-lg">
            Configure a new feature flag with targeting rules and rollout settings
          </p>
        </div>

        {/* Status Messages */}
        {submitStatus && (
          <Card className={`${submitStatus === 'success' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {submitStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <p className={`${submitStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {submitMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-blue-400" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Define the core properties of your feature flag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Flag Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.flagName}
                    onChange={(e) => handleInputChange('flagName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="My Awesome Feature"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Key (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => handleInputChange('key', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="my_awesome_feature"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.flagDescription}
                  onChange={(e) => handleInputChange('flagDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200 h-24 resize-none"
                  placeholder="Describe what this feature flag controls..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Flag Type *
                  </label>
                  <select
                    required
                    value={formData.flag_type}
                    onChange={(e) => handleInputChange('flag_type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  >
                    <option value="BOOLEAN">Boolean</option>
                    <option value="STRING">String</option>
                    <option value="NUMBER">Number</option>
                    <option value="JSON">JSON</option>
                    <option value="AB_TEST">A/B Test</option>
                    <option value="MULTIVARIATE">Multivariate</option>
                    <option value="KILL_SWITCH">Kill Switch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Environment *
                  </label>
                  <select
                    required
                    value={formData.environment}
                    onChange={(e) => handleInputChange('environment', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  >
                    <option value="DEV">Development</option>
                    <option value="STAGING">Staging</option>
                    <option value="PROD">Production</option>
                    <option value="TEST">Test</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flag Values */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                Flag Values
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Set the active and default values for your flag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Active Value *
                  </label>
                  {renderValueInput('value', formData.value)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Default Value *
                  </label>
                  {renderValueInput('default_value', formData.default_value)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Targeting Rules */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Targeting Rules
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Define who should see this feature flag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ruleName}
                    onChange={(e) => handleInputChange('ruleName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="Default Rule"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Rule Description
                  </label>
                  <input
                    type="text"
                    value={formData.ruleDescription}
                    onChange={(e) => handleInputChange('ruleDescription', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="Describe this rule..."
                  />
                </div>
              </div>

              {/* Custom Attributes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-neutral-300">
                    Custom Attributes
                  </label>
                  <button
                    type="button"
                    onClick={addCustomAttribute}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Attribute
                  </button>
                </div>
                
                {customAttributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-slate-900/40 rounded-lg">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => updateCustomAttribute(index, 'name', e.target.value)}
                      placeholder="Attribute name"
                      className="flex-1 px-2 py-1 bg-slate-800/60 border border-slate-700/40 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                    />
                    <select
                      value={attr.operator}
                      onChange={(e) => updateCustomAttribute(index, 'operator', e.target.value)}
                      className="px-2 py-1 bg-slate-800/60 border border-slate-700/40 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                    >
                      <option value="EQUALS">Equals</option>
                      <option value="NOT_EQUALS">Not Equals</option>
                      <option value="CONTAINS">Contains</option>
                      <option value="GREATER_THAN">Greater Than</option>
                      <option value="LESS_THAN">Less Than</option>
                    </select>
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateCustomAttribute(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-2 py-1 bg-slate-800/60 border border-slate-700/40 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                    />
                    <select
                      value={attr.type}
                      onChange={(e) => updateCustomAttribute(index, 'type', e.target.value)}
                      className="px-2 py-1 bg-slate-800/60 border border-slate-700/40 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                    >
                      <option value="STRING">String</option>
                      <option value="NUMBER">Number</option>
                      <option value="BOOLEAN">Boolean</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeCustomAttribute(index)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rollout Configuration */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Rollout Configuration
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Control how the feature is rolled out to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Rollout Type *
                </label>
                <select
                  required
                  value={formData.rollout_type}
                  onChange={(e) => handleInputChange('rollout_type', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="PROGRESSIVE_ROLLOUT">Progressive Rollout</option>
                  <option value="CUSTOM_PROGRESSIVE_ROLLOUT">Custom Progressive Rollout</option>
                </select>
              </div>
              
              {formData.rollout_type === 'PERCENTAGE' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Rollout Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.rollout_config.percentage || 0}
                    onChange={(e) => handleInputChange('rollout_config', { percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-white">Tags</CardTitle>
              <CardDescription className="text-neutral-400">
                Add tags to categorize and organize your feature flags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Flag...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Create Feature Flag
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFlagForm;