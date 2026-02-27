import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  Users, 
  Shield, 
  Moon, 
  Sun, 
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff
} from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      pushNotifications: false,
      lowInventoryAlerts: true,
      performanceThreshold: 75
    },
    data: {
      retentionPeriod: 365,
      backupFrequency: 'daily',
      exportFormat: 'csv',
      autoSync: true
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 120,
      passwordExpiry: 90,
      auditLogs: true
    },
    display: {
      theme: 'system',
      fontSize: 'medium',
      dashboardRefresh: 30,
      showTooltips: true
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetToDefaults = () => {
    setSettings({
      notifications: {
        emailAlerts: true,
        pushNotifications: false,
        lowInventoryAlerts: true,
        performanceThreshold: 75
      },
      data: {
        retentionPeriod: 365,
        backupFrequency: 'daily',
        exportFormat: 'csv',
        autoSync: true
      },
      security: {
        twoFactorAuth: true,
        sessionTimeout: 120,
        passwordExpiry: 90,
        auditLogs: true
      },
      display: {
        theme: 'system',
        fontSize: 'medium',
        dashboardRefresh: 30,
        showTooltips: true
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in-5 slide-in-from-top-2 duration-700">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">⚙️ System Settings</h1>
            <p className="welcome-subtitle">Configure your Snowcone dashboard preferences</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">⚙️ Live</div>
            <div className="text-sm opacity-80">Settings</div>
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎪 SnowCone Intelligence
          </h2>
          <p className="text-muted-foreground text-lg">Configure your Snowcone dashboard preferences and system settings</p>
        </div>
      </div>

      {/* ===== NOTIFICATIONS ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Notifications</CardTitle>
              <CardDescription>Manage your alert preferences and notification settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailAlerts">Email Alerts</Label>
                <input
                  type="checkbox"
                  id="emailAlerts"
                  checked={settings.notifications.emailAlerts}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailAlerts: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Receive email notifications for important updates</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushNotifications: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Get real-time browser notifications</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lowInventoryAlerts">Low Inventory Alerts</Label>
                <input
                  type="checkbox"
                  id="lowInventoryAlerts"
                  checked={settings.notifications.lowInventoryAlerts}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, lowInventoryAlerts: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Notify when inventory levels are low</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="performanceThreshold">Performance Alert Threshold (%)</Label>
              <Input
                id="performanceThreshold"
                type="number"
                min="0"
                max="100"
                value={settings.notifications.performanceThreshold}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, performanceThreshold: parseInt(e.target.value) }
                })}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">Alert when performance drops below this percentage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== DATA MANAGEMENT ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Data Management</CardTitle>
              <CardDescription>Configure data retention, backup, and export settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="retentionPeriod">Data Retention Period (days)</Label>
              <Select
                value={settings.data.retentionPeriod.toString()}
                onValueChange={(value) => setSettings({
                  ...settings,
                  data: { ...settings.data, retentionPeriod: parseInt(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                  <SelectItem value="0">Keep forever</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 dark:text-slate-400">How long to keep historical data</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={settings.data.backupFrequency}
                onValueChange={(value) => setSettings({
                  ...settings,
                  data: { ...settings.data, backupFrequency: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select backup frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 dark:text-slate-400">How often to create data backups</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="exportFormat">Default Export Format</Label>
              <Select
                value={settings.data.exportFormat}
                onValueChange={(value) => setSettings({
                  ...settings,
                  data: { ...settings.data, exportFormat: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 dark:text-slate-400">Format for data exports</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSync">Auto Sync Data</Label>
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={settings.data.autoSync}
                  onChange={(e) => setSettings({
                    ...settings,
                    data: { ...settings.data, autoSync: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Automatically sync data with Snowflake</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECURITY ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-orange-600" />
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Security</CardTitle>
              <CardDescription>Manage authentication and security settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <input
                  type="checkbox"
                  id="twoFactorAuth"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, twoFactorAuth: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Require 2FA for account access</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="15"
                max="480"
                value={settings.security.sessionTimeout}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                })}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">Auto logout after inactivity</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Select
                value={settings.security.passwordExpiry.toString()}
                onValueChange={(value) => setSettings({
                  ...settings,
                  security: { ...settings.security, passwordExpiry: parseInt(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select password expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="0">Never expire</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 dark:text-slate-400">Force password change every X days</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auditLogs">Audit Logs</Label>
                <input
                  type="checkbox"
                  id="auditLogs"
                  checked={settings.security.auditLogs}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, auditLogs: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Log all user activities</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== DISPLAY ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Display</CardTitle>
              <CardDescription>Customize your dashboard appearance and behavior</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.display.theme}
                onValueChange={(value) => setSettings({
                  ...settings,
                  display: { ...settings.display, theme: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard color scheme</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={settings.display.fontSize}
                onValueChange={(value) => setSettings({
                  ...settings,
                  display: { ...settings.display, fontSize: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 dark:text-slate-400">Text size throughout the app</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dashboardRefresh">Dashboard Refresh Rate (seconds)</Label>
              <Input
                id="dashboardRefresh"
                type="number"
                min="10"
                max="300"
                value={settings.display.dashboardRefresh}
                onChange={(e) => setSettings({
                  ...settings,
                  display: { ...settings.display, dashboardRefresh: parseInt(e.target.value) }
                })}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">How often dashboards auto-refresh</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="showTooltips">Show Tooltips</Label>
                <input
                  type="checkbox"
                  id="showTooltips"
                  checked={settings.display.showTooltips}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, showTooltips: e.target.checked }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Display helpful tooltips on hover</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== ACTIONS ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">System Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button variant="outline" onClick={resetToDefaults} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </Button>
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>Settings saved successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
