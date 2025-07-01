"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AttributeChangesViewerProps {
  attributes: any;
}

export function AttributeChangesViewer({ attributes }: AttributeChangesViewerProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900">Attributes Changed</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
            isVisible 
              ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100" 
              : "bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100"
          }`}
        >
          {isVisible ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide Changes
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              View Changes
            </>
          )}
        </Button>
      </div>
      
      {isVisible && (
        <div className="bg-gray-50 rounded-lg p-3 mt-2">
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(attributes, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 