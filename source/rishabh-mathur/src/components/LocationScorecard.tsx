import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import LocationDrillDown from "./LocationDrillDown";

export interface Location {
    LOCATION_ID: number;
    NAME: string;
    CITY: string;
    STATE: string;
    REVENUE: number;
    RATING: number;
    REVIEW_COUNT: number;
    TREND: 'up' | 'down' | 'stable';
    TREND_VAL: number;
    INVENTORY_LOAD: number;
}

interface LocationScorecardProps {
    locations: Location[];
}

export default function LocationScorecard({ locations }: LocationScorecardProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [modalLocation, setModalLocation] = useState<Location | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const filteredLocations = useMemo(() => {
        return locations.filter(loc => {
            const matchesSearch = loc.NAME.toLowerCase().includes(search.toLowerCase()) ||
                loc.CITY.toLowerCase().includes(search.toLowerCase());
            if (filter === "at-risk") return matchesSearch && (loc.INVENTORY_LOAD < 30 || loc.RATING < 3.5);
            if (filter === "top") return matchesSearch && loc.RATING >= 4.5;
            return matchesSearch;
        });
    }, [locations, search, filter]);

    const openModal = (location: Location) => {
        setModalLocation(location);
        setIsModalVisible(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsModalVisible(true);
            });
        });
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setTimeout(() => {
            setModalLocation(null);
        }, 320);
    };

    useEffect(() => {
        if (modalLocation) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [modalLocation]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-[var(--card-bg)] p-2 rounded-2xl shadow-lg border border-[var(--border-color)] transition-colors duration-500">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto p-2">
                    <div className="relative w-full sm:w-72 group">
                        <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none transition-colors">
                            <span className="material-symbols-outlined text-[var(--text-muted)] group-focus-within:text-primary text-[20px]">search</span>
                        </span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all h-11"
                            placeholder="Search locations..."
                            type="text"
                        />
                    </div>
                    <div className="h-8 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All View" />
                        <FilterButton active={filter === "at-risk"} onClick={() => setFilter("at-risk")} label="At Risk" />
                        <FilterButton active={filter === "top"} onClick={() => setFilter("top")} label="Top Performing" />
                    </div>
                </div>
            </div>

            <div className="grid-masonry">
                {filteredLocations.map((loc) => (
                    <LocationCard
                        key={loc.LOCATION_ID}
                        location={loc}
                        onViewDetails={() => openModal(loc)}
                    />
                ))}
            </div>

            {/* Location Detail Modal */}
            {modalLocation && typeof document !== "undefined" && createPortal(
                <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-12 transition-all duration-300 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div
                        className={`absolute inset-0 bg-black/70 backdrop-blur-xl transition-opacity duration-300 ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeModal}
                    ></div>
                    <div className={`relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 transform ${isModalVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-[0.98] opacity-0'}`}>
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 w-12 h-12 rounded-2xl bg-[var(--glass-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] hover:bg-primary/10 hover:border-primary/30 transition-all group active:scale-95 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-90 transition-transform">close</span>
                        </button>
                        <div className="p-2">
                            <LocationDrillDown
                                location={modalLocation}
                                onBack={closeModal}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${active
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)]"
                }`}
        >
            {label}
        </button>
    );
}

function LocationCard({ location, onViewDetails }: { location: Location, onViewDetails: () => void }) {
    const isAtRisk = location.INVENTORY_LOAD < 30 || location.RATING < 3.5;

    return (
        <div className="group relative card-gradient rounded-[2.5rem] overflow-hidden transition-all duration-500 h-full border border-[var(--border-color)] hover:border-primary/40">
            {/* iOS Style Glass Cover Overlay on Hover */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-[var(--hover-glass)] backdrop-blur-2xl">
                <div className="flex flex-col items-center text-center transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 shadow-2xl">
                        <span className="material-symbols-outlined text-primary text-4xl">analytics</span>
                    </div>
                    <h3 className="text-2xl font-black text-[var(--text-main)] mb-8 tracking-tight">{location.NAME}</h3>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails();
                        }}
                        className="bg-primary text-white hover:bg-primary/90 active:scale-95 text-sm font-black py-4 px-10 rounded-2xl w-full max-w-[220px] transition-all duration-300 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 tracking-tight group/btn"
                    >
                        View Details
                        <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </div>

            <div className="p-8 flex flex-col gap-6 h-full">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--glass-bg)] shrink-0 border border-[var(--border-color)] shadow-lg flex items-center justify-center text-2xl font-black text-primary transition-colors">
                        {location.NAME.charAt(0)}
                    </div>
                    <div className="flex flex-col pt-1 min-w-0 flex-1">
                        <h3 className="text-lg font-black text-[var(--text-main)] group-hover:text-primary transition-colors tracking-tight uppercase">{location.NAME}</h3>
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-1 font-bold">
                            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                            {location.CITY}, {location.STATE}
                        </p>
                        {isAtRisk && (
                            <span className="mt-3 inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                Action Needed
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-[var(--border-color)] pt-6 mt-auto">
                    <div>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Revenue</p>
                        <p className="text-2xl font-black text-[var(--text-main)] mt-1.5 tracking-tighter">${location.REVENUE.toLocaleString()}</p>
                        <div className={`flex items-center gap-1 text-[10px] font-black mt-2 w-fit px-2 py-0.5 rounded-md ${location.TREND === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                            }`}>
                            <span className="material-symbols-outlined text-[14px]">
                                {location.TREND === 'up' ? 'trending_up' : 'trending_down'}
                            </span>
                            <span>{Math.abs(location.TREND_VAL)}%</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Rating</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-2xl font-black text-[var(--text-main)] tracking-tighter">{location.RATING}</span>
                            <span className="material-symbols-outlined text-accent text-[22px] fill-current drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">star</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-black mt-1 tracking-tight">{location.REVIEW_COUNT} REVIEWS</p>
                    </div>
                </div>

                <div className="mt-2 bg-[var(--muted-surface)] p-4 rounded-2xl border border-[var(--border-color)] shadow-inner transition-colors duration-500">
                    <div className="flex justify-between mb-2.5 items-center">
                        <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Inventory Load</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${location.INVENTORY_LOAD < 30 ? 'text-red-500' : location.INVENTORY_LOAD < 60 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                            {location.INVENTORY_LOAD < 30 ? 'Critical' : location.INVENTORY_LOAD < 60 ? 'Warning' : 'Healthy'} ({location.INVENTORY_LOAD}%)
                        </span>
                    </div>
                    <div className="h-2 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${location.INVENTORY_LOAD < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                                location.INVENTORY_LOAD < 60 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                    'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                }`}
                            style={{ width: `${location.INVENTORY_LOAD}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
