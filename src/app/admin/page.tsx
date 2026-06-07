"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Grid,
  ChefHat,
  Music,
  Users,
  Search,
  Bell,
  CheckCircle,
  Clock,
  Sparkles,
  Smartphone,
  Coins,
  BookOpen,
  MapPin,
  ChevronRight,
  TrendingUp,
  Volume2,
  Trash2,
  Share2,
  X,
  Play,
  SkipForward,
  Plus,
  Filter,
  DollarSign,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

// Types
type TableStatus = "empty" | "scanning" | "occupied";

interface Table {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  customerName?: string;
  isLibraryMember?: boolean;
  memberId?: string;
  orderItems?: { name: string; qty: number; price: number }[];
  lastScanTime?: string;
}

interface KitchenOrder {
  id: string;
  tableNumber: number;
  items: string[];
  status: "incoming" | "progress" | "ready";
  timeElapsed: number; // in minutes
}

interface SilentRequest {
  id: string;
  tableNumber: number;
  type: "water" | "bill" | "staff";
  time: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  votes: number;
  requestedBy: string;
}

// Initial Data
const INITIAL_TABLES: Table[] = [
  { id: "t1", number: 1, seats: 2, status: "occupied", customerName: "Anya Sharma", isLibraryMember: true, memberId: "LIB-409", orderItems: [{ name: "Noiric Loaded Gourmet Pizza", qty: 1, price: 399 }, { name: "Noiric White Velvet Frappe", qty: 1, price: 219 }] },
  { id: "t2", number: 2, seats: 2, status: "empty" },
  { id: "t3", number: 3, seats: 2, status: "scanning", lastScanTime: "2 mins ago" },
  { id: "t4", number: 4, seats: 4, status: "occupied", customerName: "Vikram Malhotra", isLibraryMember: false, orderItems: [{ name: "Smoked Avocado & Cheese Burger", qty: 2, price: 249 }, { name: "Parmesan Truffle Fries", qty: 1, price: 179 }] },
  { id: "t5", number: 5, seats: 4, status: "empty" },
  { id: "t6", number: 6, seats: 4, status: "occupied", customerName: "Rohit Deshmukh", isLibraryMember: true, memberId: "LIB-982", orderItems: [{ name: "Espresso-Rubbed BBQ Chicken Burger", qty: 1, price: 289 }, { name: "Salted Caramel Cold Brew Frappe", qty: 1, price: 239 }] },
  { id: "t7", number: 7, seats: 1, status: "occupied", customerName: "Pooja Roy", isLibraryMember: true, memberId: "LIB-112", orderItems: [{ name: "Salted Caramel Cold Brew Frappe", qty: 1, price: 239 }] },
  { id: "t8", number: 8, seats: 1, status: "empty" },
  { id: "t9", number: 9, seats: 1, status: "scanning", lastScanTime: "Just now" },
  { id: "t10", number: 10, seats: 6, status: "empty" },
  { id: "t11", number: 11, seats: 6, status: "occupied", customerName: "Aditya & Friends", isLibraryMember: false, orderItems: [{ name: "Noiric Loaded Gourmet Pizza", qty: 2, price: 399 }, { name: "Smoked Avocado & Cheese Burger", qty: 3, price: 249 }, { name: "Spicy Peri-Peri Dust Fries", qty: 2, price: 149 }, { name: "Noiric White Velvet Frappe", qty: 4, price: 219 }] },
  { id: "t12", number: 12, seats: 2, status: "empty" }
];

const INITIAL_KITCHEN_ORDERS: KitchenOrder[] = [
  { id: "k1", tableNumber: 1, items: ["1x Loaded Pizza", "1x White Velvet Frappe"], status: "progress", timeElapsed: 8 },
  { id: "k2", tableNumber: 6, items: ["1x BBQ Chicken Burger", "1x Salted Caramel Frappe"], status: "progress", timeElapsed: 4 },
  { id: "k3", tableNumber: 4, items: ["2x Avocado Burger", "1x Truffle Fries"], status: "ready", timeElapsed: 12 },
  { id: "k4", tableNumber: 11, items: ["2x Loaded Pizza", "3x Avocado Burger", "2x Peri-Peri Fries", "4x Velvet Frappe"], status: "incoming", timeElapsed: 1 }
];

const INITIAL_SILENT_REQUESTS: SilentRequest[] = [
  { id: "sr1", tableNumber: 4, type: "water", time: "1 min ago" },
  { id: "sr2", tableNumber: 7, type: "bill", time: "3 mins ago" }
];

const INITIAL_JUKEBOX: Song[] = [
  { id: "s1", title: "Autumn Leaves", artist: "Chet Baker", votes: 8, requestedBy: "Rahul S. (Table 7)" },
  { id: "s2", title: "Midnight City", artist: "M83", votes: 5, requestedBy: "Aanya K. (Table 3)" },
  { id: "s3", title: "Coffee & TV", artist: "Blur", votes: 4, requestedBy: "Anonymous (Table 11)" },
  { id: "s4", title: "Sunrise", artist: "Norah Jones", votes: 2, requestedBy: "Dev C. (Table 1)" }
];

export default function AdminDashboard() {
  // Tabs Navigation
  const [activeTab, setActiveTab] = useState<"overview" | "seat-matrix" | "kitchen" | "jukebox" | "loyalty">("seat-matrix");
  
  // Real-time Database States
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>(INITIAL_KITCHEN_ORDERS);
  const [silentRequests, setSilentRequests] = useState<SilentRequest[]>(INITIAL_SILENT_REQUESTS);
  const [jukebox, setJukebox] = useState<Song[]>(INITIAL_JUKEBOX);
  
  // Selection and simulation states
  const [selectedTableId, setSelectedTableId] = useState<string | null>("t1");
  const [notification, setNotification] = useState<string | null>(null);

  // Loyalty Search Form State
  const [loyaltySearch, setLoyaltySearch] = useState("");
  const [redeemPhone, setRedeemPhone] = useState("");
  const [redeemCoupon, setRedeemCoupon] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "success" | "error">("idle");

  // Simulated live event system (representing Supabase channel sync)
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly trigger database-level events
      const rand = Math.random();
      
      if (rand < 0.25) {
        // Event A: A table starts scanning QR
        const emptyTables = tables.filter(t => t.status === "empty");
        if (emptyTables.length > 0) {
          const targetTable = emptyTables[Math.floor(Math.random() * emptyTables.length)];
          setTables(prev => prev.map(t => t.id === targetTable.id ? { ...t, status: "scanning", lastScanTime: "Just now" } : t));
          triggerToast(`Supabase Sync: Table ${targetTable.number} is scanning menu QR code.`);
        }
      } else if (rand < 0.5) {
        // Event B: A customer makes a silent request
        const occupiedTables = tables.filter(t => t.status === "occupied");
        if (occupiedTables.length > 0) {
          const targetTable = occupiedTables[Math.floor(Math.random() * occupiedTables.length)];
          const types: ("water" | "bill" | "staff")[] = ["water", "bill", "staff"];
          const newRequest: SilentRequest = {
            id: `sr-${Date.now()}`,
            tableNumber: targetTable.number,
            type: types[Math.floor(Math.random() * types.length)],
            time: "Just now"
          };
          setSilentRequests(prev => [newRequest, ...prev]);
          triggerToast(`Real-time Alert: Table ${targetTable.number} requested ${newRequest.type.toUpperCase()} silently.`);
        }
      } else if (rand < 0.7) {
        // Event C: Someone upvotes a jukebox song
        if (jukebox.length > 0) {
          const targetIdx = Math.floor(Math.random() * jukebox.length);
          setJukebox(prev => prev.map((s, idx) => idx === targetIdx ? { ...s, votes: s.votes + 1 } : s).sort((a, b) => b.votes - a.votes));
          triggerToast(`Vibe Sync: Upvote registered for "${jukebox[targetIdx].title}".`);
        }
      }
    }, 12000); // Trigger event every 12 seconds

    return () => clearInterval(interval);
  }, [tables, jukebox]);

  // Helper to show flash notification banner
  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Get active table data
  const selectedTable = tables.find(t => t.id === selectedTableId);

  // Table calculations
  const totalRevenueToday = tables.reduce((acc, t) => {
    const tableBill = t.orderItems?.reduce((sub, item) => sub + (item.price * item.qty), 0) || 0;
    return acc + tableBill;
  }, 14450); // Seeded starting total

  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const scanningCount = tables.filter(t => t.status === "scanning").length;
  const emptyCount = tables.filter(t => t.status === "empty").length;

  // Actions
  const updateTableStatus = (id: string, status: TableStatus) => {
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, status };
        if (status === "empty") {
          delete updated.customerName;
          delete updated.orderItems;
          delete updated.isLibraryMember;
          delete updated.memberId;
        } else if (status === "occupied" && !t.customerName) {
          updated.customerName = "Walk-in Guest";
          updated.orderItems = [{ name: "Coffee Frappe", qty: 1, price: 219 }];
        }
        return updated;
      }
      return t;
    }));
    triggerToast(`Local state saved & synced with Supabase for Table ${tables.find(t => t.id === id)?.number}.`);
  };

  const addItemsToTable = (id: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: "occupied",
          customerName: t.customerName || "Gourmet Diner",
          orderItems: [
            ...(t.orderItems || []),
            { name: "Noiric Loaded Gourmet Pizza", qty: 1, price: 399 },
            { name: "Salted Caramel Cold Brew Frappe", qty: 1, price: 239 }
          ]
        };
      }
      return t;
    }));
    triggerToast(`Added signature combo to Table ${tables.find(t => t.id === id)?.number}.`);
  };

  const resolveSilentRequest = (id: string) => {
    setSilentRequests(prev => prev.filter(r => r.id !== id));
    triggerToast("Silent Request resolved.");
  };

  const moveKitchenOrder = (id: string, nextStatus: "incoming" | "progress" | "ready") => {
    setKitchenOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    triggerToast(`Kitchen Order #${id} moved to ${nextStatus.toUpperCase()}.`);
  };

  const skipSong = (id: string) => {
    setJukebox(prev => prev.filter(s => s.id !== id));
    triggerToast("Song skipped by Staff Override.");
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemPhone || !redeemCoupon) {
      setRedeemStatus("error");
      return;
    }
    setRedeemStatus("success");
    triggerToast(`Coupon ${redeemCoupon} redeemed for ${redeemPhone}.`);
    setTimeout(() => {
      setRedeemStatus("idle");
      setRedeemPhone("");
      setRedeemCoupon("");
    }, 3000);
  };

  // Manual Simulator Action to show off Supabase syncing
  const triggerManualSimulation = () => {
    // Make table 8 occupied
    setTables(prev => prev.map(t => {
      if (t.id === "t8") {
        return {
          ...t,
          status: "occupied",
          customerName: "Aarav Gupta (Library VIP)",
          isLibraryMember: true,
          memberId: "LIB-001",
          orderItems: [
            { name: "Truffle Mushroom Wood-Fired Pizza", qty: 1, price: 349 },
            { name: "Parmesan Truffle Fries", qty: 1, price: 179 }
          ]
        };
      }
      return t;
    }));

    // Add kitchen order
    const newKOrder: KitchenOrder = {
      id: `k-${Date.now().toString().slice(-4)}`,
      tableNumber: 8,
      items: ["1x Truffle Pizza", "1x Truffle Fries"],
      status: "incoming",
      timeElapsed: 0
    };
    setKitchenOrders(prev => [newKOrder, ...prev]);

    triggerToast("Real-time Sync Triggered: Table 8 scanned QR, ordered Truffle Combo, and updated Kitchen Kanban!");
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-md">
              sA
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-none text-slate-900 tracking-wide font-heading">synchAD Command</h1>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase block mt-1">Noiric Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {/* Overview */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            {/* Live Seat Matrix */}
            <button
              onClick={() => setActiveTab("seat-matrix")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "seat-matrix"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Live Seat Matrix</span>
              <span className="ml-auto bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {scanningCount} Scan
              </span>
            </button>

            {/* Kitchen KDS */}
            <button
              onClick={() => setActiveTab("kitchen")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "kitchen"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen Display</span>
              {kitchenOrders.filter(o => o.status === "incoming").length > 0 && (
                <span className="ml-auto bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {kitchenOrders.filter(o => o.status === "incoming").length} New
                </span>
              )}
            </button>

            {/* Vibe & Jukebox */}
            <button
              onClick={() => setActiveTab("jukebox")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "jukebox"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Vibe & Jukebox</span>
            </button>

            {/* Loyalty & Library Sync */}
            <button
              onClick={() => setActiveTab("loyalty")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "loyalty"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Loyalty & Library</span>
            </button>
          </nav>
        </div>

        {/* Agency Upsell Footer Branding */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-semibold text-slate-600">Supabase Channel Live</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Version 1.4.0 — Kryto Studio</p>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-heading font-bold text-lg text-slate-800 uppercase tracking-wider">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "seat-matrix" && "Live Seat Matrix"}
              {activeTab === "kitchen" && "Kitchen KDS (Silent Orbit)"}
              {activeTab === "jukebox" && "Jukebox & Ambience Vibe"}
              {activeTab === "loyalty" && "Loyalty & Library Sync"}
            </h2>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <span className="text-xs text-slate-500 hidden sm:inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              MG Road, Ambikapur Branch
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Supabase Event Simulation Control */}
            <button
              onClick={triggerManualSimulation}
              className="hidden lg:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm active:scale-95"
              title="Manually simulate a real-time event from customer device"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Simulate Realtime Order
            </button>

            {/* Time Stamp */}
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Local Time</span>
              <span className="text-xs font-semibold text-slate-700">June 4, 10:05 PM</span>
            </div>

            {/* Staff User Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                OP
              </div>
              <div className="text-left hidden xl:block">
                <span className="text-xs font-bold text-slate-800 block leading-none">Operator</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Shift Lead #1</span>
              </div>
            </div>
          </div>
        </header>

        {/* NOTIFICATION FLOATING TOAST BAR */}
        {notification && (
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4 shadow-xl text-sm border border-slate-800 transition-all duration-300 animate-slide-in relative z-50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
              <span className="font-medium">{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PANEL PAGE VIEWS */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Metric 1 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Today&apos;s Revenue</span>
                    <h3 className="text-2xl font-bold font-heading text-slate-900">₹{totalRevenueToday}</h3>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" /> +12.4% vs Yesterday
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Active Tables</span>
                    <h3 className="text-2xl font-bold font-heading text-slate-900">{occupiedCount} / {tables.length}</h3>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      {scanningCount} scanning tables now
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
                    <Grid className="w-5 h-5" />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Pending Orders</span>
                    <h3 className="text-2xl font-bold font-heading text-slate-900">
                      {kitchenOrders.filter(o => o.status !== "ready").length}
                    </h3>
                    <span className="text-[10px] text-red-600 font-semibold block mt-1">
                      {kitchenOrders.filter(o => o.status === "incoming").length} in incoming queue
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
                    <ChefHat className="w-5 h-5" />
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Loyalty Tokens Issued</span>
                    <h3 className="text-2xl font-bold font-heading text-slate-900">480</h3>
                    <span className="text-[10px] text-indigo-600 font-semibold block mt-1">
                      +92 members registered today
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Lower details row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Live Events Log */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-950 uppercase tracking-wider mb-6">Real-Time Event Stream</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                      <div className="flex-1">
                        <span className="text-xs text-slate-400 font-semibold block">10:04 PM — Scan Hub</span>
                        <p className="text-xs text-slate-700 font-semibold mt-0.5">Table 8 scanned Table QR Code and launched web portal.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <span className="text-xs text-slate-400 font-semibold block">09:58 PM — Jukebox Hub</span>
                        <p className="text-xs text-slate-700 font-semibold mt-0.5">Rahul S. (Table 7) requested song &quot;Autumn Leaves&quot; with 8 token votes.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                      <div className="flex-1">
                        <span className="text-xs text-slate-400 font-semibold block">09:50 PM — Silent Orbit</span>
                        <p className="text-xs text-slate-700 font-semibold mt-0.5">Table 4 triggered Silent Alert requesting water refill.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Silent requests alerts list */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-950 uppercase tracking-wider mb-6">Active Silent Requests</h3>
                  {silentRequests.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                      <CheckCircle className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-500 font-semibold">No active service alerts.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {silentRequests.map((request) => (
                        <div key={request.id} className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-red-800">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span className="font-heading font-bold text-xs uppercase tracking-wider">
                                Table {request.tableNumber}: Needs {request.type.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[10px] text-red-600 font-medium block mt-1">Requested {request.time}</span>
                          </div>
                          <button
                            onClick={() => resolveSilentRequest(request.id)}
                            className="bg-white hover:bg-red-100 text-red-800 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: LIVE SEAT MATRIX (DETAILED REQUIREMENT) */}
          {activeTab === "seat-matrix" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-fade-in">
              
              {/* Left Side: 2D Grid Representation */}
              <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
                
                {/* Grid Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-950">Cafe Interior Floor Map</h3>
                    <p className="text-xs text-slate-500 mt-1">Arrangement of active window booths, center lounges, and library sync workstations.</p>
                  </div>

                  {/* Color Codes Legend */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-300"></div>
                      <span className="text-emerald-800 font-medium text-[11px] uppercase">Empty ({emptyCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300"></div>
                      <span className="text-amber-800 font-medium text-[11px] uppercase">Scanning ({scanningCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-100 border border-rose-300 animate-pulse"></div>
                      <span className="text-rose-800 font-medium text-[11px] uppercase">Occupied ({occupiedCount})</span>
                    </div>
                  </div>
                </div>

                {/* 2D Visual Seat Layout Grid */}
                <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 mb-6">
                  {/* Decorative Bar Counter representation */}
                  <div className="w-full h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest mb-10 shadow-sm">
                    Bar Counter & Espresso Station
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {tables.map((table) => {
                      const isActive = table.id === selectedTableId;
                      const hasAlert = silentRequests.some(r => r.tableNumber === table.number);
                      
                      let bgClass = "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800";
                      if (table.status === "scanning") {
                        bgClass = "bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-800";
                      } else if (table.status === "occupied") {
                        bgClass = "bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-800";
                      }

                      return (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTableId(table.id)}
                          className={`aspect-square rounded-2xl p-4 border flex flex-col justify-between items-start transition-all relative group ${bgClass} ${
                            isActive ? "ring-2 ring-slate-900 ring-offset-2 scale-[1.02] shadow-md" : "shadow-xs"
                          }`}
                        >
                          {/* Alert indicator dot */}
                          {hasAlert && (
                            <span className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-bounce">
                              !
                            </span>
                          )}

                          {/* Table number & Seats count */}
                          <div className="flex justify-between items-center w-full">
                            <span className="font-heading font-extrabold text-lg">T-{table.number}</span>
                            <span className="text-[10px] font-semibold bg-white/70 px-2 py-0.5 rounded-md">
                              {table.seats} Seats
                            </span>
                          </div>

                          {/* Customer Name or Status Description */}
                          <div className="w-full text-left mt-4">
                            {table.status === "empty" && (
                              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">Ready</span>
                            )}
                            {table.status === "scanning" && (
                              <div className="animate-pulse">
                                <span className="text-[9px] font-bold uppercase tracking-wider block opacity-85 text-amber-700">QR Scanning</span>
                                <span className="text-[8px] block text-amber-600 mt-0.5">{table.lastScanTime}</span>
                              </div>
                            )}
                            {table.status === "occupied" && (
                              <div>
                                <span className="text-[10px] font-bold truncate block max-w-[100px]">
                                  {table.customerName}
                                </span>
                                {table.isLibraryMember && (
                                  <span className="text-[8px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded block w-max mt-1 uppercase">
                                    Library
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Micro indicator footer */}
                          <div className="w-full text-right mt-2 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            View details &rarr;
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Decorative Exit Door representation */}
                  <div className="w-max mx-auto px-6 py-1 bg-slate-200 rounded-b-xl text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-10">
                    Main Entrance & Patio Door
                  </div>
                </div>

                {/* Real-time simulation info block */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span>Real-time seat matrix automatically refreshes via Supabase table listeners as customers scan or pay.</span>
                  </div>
                  <button
                    onClick={() => {
                      setTables(INITIAL_TABLES);
                      setSelectedTableId("t1");
                      triggerToast("Restored local table matrix to default demo state.");
                    }}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
                  </button>
                </div>

              </div>

              {/* Right Side: Table Detail Side Panel */}
              <div className="xl:col-span-4">
                {selectedTable ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                    
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Table Details</span>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          selectedTable.status === "empty" ? "bg-emerald-100 text-emerald-800" :
                          selectedTable.status === "scanning" ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {selectedTable.status}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-xl text-slate-900">Table #0{selectedTable.number}</h4>
                      <p className="text-xs text-slate-500 mt-1">Capacity: {selectedTable.seats} seats</p>
                    </div>

                    {/* Customer Status Details */}
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Session</h5>
                      {selectedTable.status === "empty" ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                          <p className="text-xs text-slate-500 font-medium">Table is currently empty.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Awaiting QR scan from guest device.</p>
                        </div>
                      ) : selectedTable.status === "scanning" ? (
                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                          <p className="text-xs font-semibold text-amber-800">Dynamic Menu Launched</p>
                          <p className="text-[10px] text-amber-600 mt-1">Customer scanned QR code {selectedTable.lastScanTime}. Currently reviewing item details.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm">
                              {selectedTable.customerName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{selectedTable.customerName}</p>
                              {selectedTable.isLibraryMember ? (
                                <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                                  <BookOpen className="w-3.5 h-3.5" /> Library Sync Member ({selectedTable.memberId})
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Walk-in Guest</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Active Order Items */}
                    {selectedTable.status === "occupied" && selectedTable.orderItems && (
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Current Bill Summary</h5>
                        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                          {selectedTable.orderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 text-xs">
                              <div>
                                <span className="font-semibold text-slate-800 block">{item.name}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">₹{item.price} each</span>
                              </div>
                              <span className="font-bold text-slate-900">{item.qty}x</span>
                            </div>
                          ))}
                          
                          <div className="p-3 bg-white flex justify-between items-center text-xs font-bold text-slate-900">
                            <span>Subtotal</span>
                            <span>
                              ₹{selectedTable.orderItems.reduce((sub, item) => sub + (item.price * item.qty), 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Controls */}
                    <div className="pt-4 border-t border-slate-100 space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Staff Operations</span>
                      
                      {selectedTable.status === "empty" ? (
                        <>
                          <button
                            onClick={() => updateTableStatus(selectedTable.id, "occupied")}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
                          >
                            Mark as Occupied
                          </button>
                          <button
                            onClick={() => updateTableStatus(selectedTable.id, "scanning")}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-lg transition-colors"
                          >
                            Simulate Customer QR Scan
                          </button>
                        </>
                      ) : (
                        <>
                          {selectedTable.status === "occupied" && (
                            <button
                              onClick={() => addItemsToTable(selectedTable.id)}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Signature Combo
                            </button>
                          )}
                          <button
                            onClick={() => {
                              alert(`Receipt printed for Table ${selectedTable.number}. Invoice #${Date.now().toString().slice(-6)}`);
                              updateTableStatus(selectedTable.id, "empty");
                            }}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-lg transition-colors"
                          >
                            Print Receipt & Free Table
                          </button>
                          <button
                            onClick={() => updateTableStatus(selectedTable.id, "empty")}
                            className="w-full text-red-600 hover:bg-red-50 text-xs font-semibold py-2.5 rounded-lg transition-colors"
                          >
                            Force Clear Table
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
                    <Grid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Select a table on the map to review details.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: KITCHEN DISPLAY SYSTEM */}
          {activeTab === "kitchen" && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Kitchen top alerts */}
              <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
                <div>
                  <h3 className="font-heading font-bold text-base text-white">Silent Request Monitor</h3>
                  <p className="text-xs text-slate-400 mt-1">Live requests sent from table QR portals directly. Responds immediately without acoustic noise.</p>
                </div>
                
                {/* Active alert boxes */}
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                  {silentRequests.length === 0 ? (
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-900 px-4 py-2 rounded-lg">
                      ✓ All Tables Serviced
                    </span>
                  ) : (
                    silentRequests.map(r => (
                      <div key={r.id} className="bg-red-950/60 border border-red-900 px-4 py-2 rounded-lg text-xs flex items-center gap-3">
                        <span className="font-bold text-red-300 uppercase">T-{r.tableNumber}: Needs {r.type.toUpperCase()}</span>
                        <button
                          onClick={() => resolveSilentRequest(r.id)}
                          className="bg-white text-slate-950 text-[10px] font-bold px-2 py-1 rounded hover:bg-slate-100 transition-colors uppercase"
                        >
                          Served
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kanban board */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Column 1: Incoming */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">Incoming Orders</span>
                    <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {kitchenOrders.filter(o => o.status === "incoming").length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {kitchenOrders.filter(o => o.status === "incoming").map((order) => (
                      <div key={order.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-heading font-bold text-sm text-slate-900">Table #0{order.tableNumber}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5" /> {order.timeElapsed}m
                          </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1 mb-4">
                          {order.items.map((it, idx) => <li key={idx} className="font-medium">• {it}</li>)}
                        </ul>
                        <button
                          onClick={() => moveKitchenOrder(order.id, "progress")}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors"
                        >
                          Start Cooking
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">In Progress</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {kitchenOrders.filter(o => o.status === "progress").length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {kitchenOrders.filter(o => o.status === "progress").map((order) => (
                      <div key={order.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-heading font-bold text-sm text-slate-900">Table #0{order.tableNumber}</span>
                          <span className="text-[10px] text-blue-600 flex items-center gap-1 font-bold animate-pulse">
                            <Clock className="w-3.5 h-3.5" /> {order.timeElapsed}m
                          </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1 mb-4">
                          {order.items.map((it, idx) => <li key={idx} className="font-medium">• {it}</li>)}
                        </ul>
                        <button
                          onClick={() => moveKitchenOrder(order.id, "ready")}
                          className="w-full bg-blue-650 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors"
                        >
                          Mark Ready to Serve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Ready to Serve */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">Ready to Serve</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {kitchenOrders.filter(o => o.status === "ready").length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {kitchenOrders.filter(o => o.status === "ready").map((order) => (
                      <div key={order.id} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-250">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-heading font-bold text-sm text-slate-900">Table #0{order.tableNumber}</span>
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> Ready
                          </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1 mb-4">
                          {order.items.map((it, idx) => <li key={idx} className="font-medium">• {it}</li>)}
                        </ul>
                        <button
                          onClick={() => setKitchenOrders(prev => prev.filter(o => o.id !== order.id))}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors"
                        >
                          Deliver to Table
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: JUKEBOX CONTROL */}
          {activeTab === "jukebox" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
              
              {/* Left Side: Song Queue */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-950">Customer Vibe Queue</h3>
                    <p className="text-xs text-slate-500 mt-1">Real-time listing of music selections voted by guests using loyalty tokens.</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3.5 py-1.5 rounded-full">
                    {jukebox.length} Songs Queued
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {jukebox.map((song, idx) => (
                    <div key={song.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Queue Position */}
                        <span className="font-heading font-extrabold text-sm text-slate-400 w-6">
                          #{idx + 1}
                        </span>
                        {/* Audio Symbol */}
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                        {/* Details */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{song.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{song.artist} — Requested by {song.requestedBy}</p>
                        </div>
                      </div>

                      {/* Vote Count and Actions */}
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">{song.votes} Votes</span>
                          <span className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider block mt-0.5">Token Boosted</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => skipSong(song.id)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title="Staff Skip Override"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Player Status & Control Console */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <h4 className="font-heading font-bold text-sm text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-4">
                  Vibe Console
                </h4>

                {/* Now Playing Widget */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-inner relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Now Playing</span>
                    <h5 className="font-heading font-bold text-sm text-white truncate">Kind of Blue</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Miles Davis (Classical Quintet)</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-slate-700 rounded-full mt-6 mb-2 overflow-hidden">
                      <div className="w-3/5 h-full bg-white rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                      <span>2:45</span>
                      <span>4:32</span>
                    </div>
                  </div>
                </div>

                {/* Staff controls */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Volume (Zone 1)</span>
                    <Volume2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-slate-900 rounded-full"></div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ambience Preset overrides</span>
                    <button className="w-full bg-slate-950 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wider">
                      Override with Master Playlist
                    </button>
                    <button className="w-full bg-white text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-wider">
                      Mute Jukebox Sound
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: LOYALTY & LIBRARY SYNC */}
          {activeTab === "loyalty" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
              
              {/* Left Side: Library sync members list */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-950">Library Sync Members In-Store</h3>
                    <p className="text-xs text-slate-500 mt-1">Cross-platform integration list. Automatically syncs shared workspaces.</p>
                  </div>

                  {/* Search members */}
                  <div className="relative w-full sm:w-60">
                    <input
                      type="text"
                      placeholder="Search active members..."
                      value={loyaltySearch}
                      onChange={(e) => setLoyaltySearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4">Workspace ID</th>
                        <th className="py-3 px-4">Table</th>
                        <th className="py-3 px-4">Tokens Balance</th>
                        <th className="py-3 px-4">Session Elapsed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {tables
                        .filter(t => t.status === "occupied" && t.isLibraryMember)
                        .filter(t => !loyaltySearch || t.customerName?.toLowerCase().includes(loyaltySearch.toLowerCase()))
                        .map((table) => (
                          <tr key={table.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{table.customerName}</td>
                            <td className="py-3.5 px-4 text-slate-600 font-mono">{table.memberId}</td>
                            <td className="py-3.5 px-4"><span className="font-bold text-slate-700">T-{table.number}</span></td>
                            <td className="py-3.5 px-4 font-semibold text-indigo-650">140 Tokens</td>
                            <td className="py-3.5 px-4 text-slate-500">1h 15m</td>
                          </tr>
                        ))}
                      {tables.filter(t => t.status === "occupied" && t.isLibraryMember).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                            No synced library members checked in at active tables.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side: Manual Override Coupon Form */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h4 className="font-heading font-bold text-sm text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6">
                  Manual Coupon Override
                </h4>

                <form onSubmit={handleRedeem} className="space-y-4">
                  <div>
                    <label htmlFor="override-phone" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Customer Phone Number
                    </label>
                    <input
                      type="tel"
                      id="override-phone"
                      placeholder="e.g., 9876543210"
                      value={redeemPhone}
                      onChange={(e) => setRedeemPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="override-coupon" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Loyalty Coupon / Token QR Code
                    </label>
                    <input
                      type="text"
                      id="override-coupon"
                      placeholder="e.g., NRC-FREE-BREW"
                      value={redeemCoupon}
                      onChange={(e) => setRedeemCoupon(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  {redeemStatus === "success" && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                      ✓ Coupon Applied! Discount applied directly to invoice.
                    </div>
                  )}

                  {redeemStatus === "error" && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[10px] font-bold text-red-800">
                      ✕ Error: Please fill in all fields to register override.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors uppercase tracking-wider mt-4"
                  >
                    Apply Manual Reward
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
