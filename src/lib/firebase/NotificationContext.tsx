'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the notification object
// Adjust this based on your actual Firebase message payload
export interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    [key: string]: string;
  };
  messageId?: string;
  from?: string;
}

interface NotificationContextType {
  lastNotification: NotificationPayload | null;
  setLastNotification: (notification: NotificationPayload | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [lastNotification, setLastNotification] =
    useState<NotificationPayload | null>(null);

  return (
    <NotificationContext.Provider
      value={{ lastNotification, setLastNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
