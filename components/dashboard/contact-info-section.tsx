"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserCog, Mail } from "lucide-react";

interface ContactInfoSectionProps {
  contactInfo?: {
    manager: { userName: string; email: string | null } | null;
    headManager: { userName: string; email: string | null } | null;
  };
  isLoading?: boolean;
}

export function ContactInfoSection({
  contactInfo,
  isLoading = false,
}: ContactInfoSectionProps) {
  const hasContactInfo =
    contactInfo?.manager || contactInfo?.headManager;

  return (
    <Card className="h-full flex flex-col gap-2 py-1 min-h-0">
      <CardHeader className="flex-shrink-0 pb-1 px-3 sm:px-4 pt-1 gap-1">
        <CardTitle className="text-sm sm:text-base font-semibold">Contact Information</CardTitle>
        <CardDescription className="text-xs leading-tight">Your supervisors and contacts</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-1 sm:p-2 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            <div className="p-2 bg-muted/30 rounded-lg animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ) : !hasContactInfo ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              No contact information available
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {contactInfo.headManager && (
              <div className="p-1.5 sm:p-2 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="flex-shrink-0 p-1 rounded-md bg-primary/10">
                    <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium leading-tight mb-1">
                      Head Manager
                    </p>
                    <p className="text-xs font-semibold text-foreground mb-1">
                      {contactInfo.headManager.userName}
                    </p>
                    {contactInfo.headManager.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={`mailto:${contactInfo.headManager.email}`}
                          className="text-[10px] sm:text-xs text-primary hover:underline"
                        >
                          {contactInfo.headManager.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {contactInfo.manager && (
              <div className="p-1.5 sm:p-2 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="flex-shrink-0 p-1 rounded-md bg-muted">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium leading-tight mb-1">Manager</p>
                    <p className="text-xs font-semibold text-foreground mb-1">
                      {contactInfo.manager.userName}
                    </p>
                    {contactInfo.manager.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={`mailto:${contactInfo.manager.email}`}
                          className="text-[10px] sm:text-xs text-primary hover:underline"
                        >
                          {contactInfo.manager.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

