import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, MapPin, Edit, Search } from 'lucide-react';
import { routeService, Route, RoutePoint } from '@/services/routeService';
import { unitService } from '@/services/unitService';
import { locationService } from '@/services/locationService';
import InteractiveMap from '@/components/routes/InteractiveMap';

// Types for Unit and Location (assuming simplistic structure from services)
interface Unit {
    id: string;
    name: string;
}

interface Location {
    id: string;
    name: string;
}

export default function RoutesAndPoints() {
    const { toast } = useToast();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [currentRoute, setCurrentRoute] = useState<Partial<Route>>({
        name: '',
        description: '',
        estimatedDuration: 0,
        checkpointsRequired: false,
        geofenceEnabled: false,
        defaultRadiusMeters: 50,
        points: []
    });
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [routesData, unitsData, locationsData] = await Promise.all([
                routeService.findAllRoutes(),
                unitService.getAllUnits(), // Assuming method name
                locationService.getAllLocations() // Assuming method name
            ]);
            setRoutes(routesData);
            setUnits(unitsData);
            setLocations(locationsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast({
                title: "Error",
                description: "Failed to load routes data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setCurrentRoute({
            name: '',
            description: '',
            estimatedDuration: 0,
            checkpointsRequired: false,
            geofenceEnabled: false,
            defaultRadiusMeters: 50,
            points: []
        });
        setSelectedUnitId('');
        setSelectedLocationId('');
        setIsModalOpen(true);
    };

    const handleEdit = (route: Route) => {
        setCurrentRoute({
            ...route,
            points: route.points || []
        });
        setSelectedUnitId(route.unit?.id || '');
        setSelectedLocationId(route.location?.id || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this route?")) return;
        try {
            await routeService.deleteRoute(id);
            toast({ title: "Success", description: "Route deleted successfully." });
            loadData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete route.", variant: "destructive" });
        }
    };

    const handleSave = async () => {
        if (!currentRoute.name || !selectedUnitId || !selectedLocationId || !currentRoute.estimatedDuration) {
            toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        const unit = units.find(u => u.id === selectedUnitId);
        const location = locations.find(l => l.id === selectedLocationId);

        if (!unit || !location) {
            toast({ title: "Error", description: "Invalid Unit or Location selected.", variant: "destructive" });
            return;
        }

        const routeData: Partial<Route> = {
            ...currentRoute,
            unit: { id: unit.id, name: unit.name },
            location: { id: location.id, name: location.name },
            // Ensure points follow backend order
            points: currentRoute.points?.map((p, index) => ({ ...p, order: index + 1 }))
        };

        try {
            if (currentRoute.id) {
                await routeService.updateRoute(currentRoute.id, routeData);
                toast({ title: "Success", description: "Route updated successfully." });
            } else {
                await routeService.createRoute(routeData);
                toast({ title: "Success", description: "Route created successfully." });
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save route.", variant: "destructive" });
        }
    };

    // Points Management
    const addPoint = () => {
        const newPoint: RoutePoint = {
            name: `Point ${(currentRoute.points?.length || 0) + 1}`,
            latitude: 0,
            longitude: 0,
            order: (currentRoute.points?.length || 0) + 1,
            type: 'CHECKPOINT', // Default type, need to map to backend type in UI
            radiusMeters: currentRoute.defaultRadiusMeters || 50
        } as any; // Cast because 'CHECKPOINT' is not in strict type pending update, or we map it

        // Actually, let's use valid types from the updated service
        // 'START' | 'BOARDING' | 'DEBARKATION' | 'END'
        // If the user wants "Checkpoint", maybe "BOARDING" or "DEBARKATION" is closest?
        // Or maybe I should update backend to include CHECKPOINT?
        // For now let's use 'BOARDING' as a generic "Stop".
        const validPoint: RoutePoint = {
            name: `Point ${(currentRoute.points?.length || 0) + 1}`,
            latitude: 0,
            longitude: 0,
            order: (currentRoute.points?.length || 0) + 1,
            type: 'BOARDING',
            radiusMeters: currentRoute.defaultRadiusMeters || 50
        };

        setCurrentRoute({
            ...currentRoute,
            points: [...(currentRoute.points || []), validPoint]
        });
    };

    const updatePoint = (index: number, field: keyof RoutePoint, value: any) => {
        const newPoints = [...(currentRoute.points || [])];
        newPoints[index] = { ...newPoints[index], [field]: value };
        setCurrentRoute({ ...currentRoute, points: newPoints });
    };

    const removePoint = (index: number) => {
        const newPoints = [...(currentRoute.points || [])];
        newPoints.splice(index, 1);
        setCurrentRoute({ ...currentRoute, points: newPoints });
    };

    const handleAddressSearch = async (index: number, query: string) => {
        if (!query || query.length < 3) return;

        try {
            const token = import.meta.env.VITE_MAPBOX_TOKEN;
            if (!token) {
                toast({ title: "Configuration Error", description: "Mapbox Token not found.", variant: "destructive" });
                return;
            }

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                // Update point with found coordinates
                const newPoints = [...(currentRoute.points || [])];
                newPoints[index] = {
                    ...newPoints[index],
                    latitude: lat,
                    longitude: lng,
                    name: query // Optional: auto-update name to matched address
                };
                setCurrentRoute({ ...currentRoute, points: newPoints });

                toast({ title: "Address Found", description: `Location updated to: ${data.features[0].place_name}` });
            } else {
                toast({ title: "Not Found", description: "Address not found.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            toast({ title: "Error", description: "Failed to search address.", variant: "destructive" });
        }
    };

    const filteredRoutes = routes.filter(route =>
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">Route Definition & Geofencing</h1>
                <Button onClick={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" /> New Route
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left Column: List */}
                <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden">
                    <CardHeader className="shrink-0">
                        <div className="flex flex-col space-y-2">
                            <CardTitle>Routes List</CardTitle>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search routes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        <Table>
                            <TableHeader className="sticky top-0 bg-secondary">
                                <TableRow>
                                    <TableHead>Route Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredRoutes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">No routes found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRoutes.map((route) => (
                                        <TableRow
                                            key={route.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setCurrentRoute(route)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{route.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {route.points?.length || 0} points • {route.estimatedDuration}s
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(route); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Right Column: Map Visualization */}
                <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden bg-muted/20">
                    <CardHeader className="shrink-0 py-3 px-4 border-b flex flex-row justify-between items-center bg-card">
                        <CardTitle className="text-base font-medium">
                            {currentRoute.id ? `Visualizing: ${currentRoute.name}` : 'Route Map Preview'}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground">
                            {currentRoute.points?.length || 0} points
                        </div>
                    </CardHeader>
                    <div className="flex-1 relative min-h-[400px]">
                        <InteractiveMap
                            points={currentRoute.points?.map(p => ({
                                id: p.id || Math.random().toString(), // Fallback ID for new points
                                latitude: p.latitude,
                                longitude: p.longitude,
                                label: p.name
                            }))}
                            readOnly={!isModalOpen}
                            // If modal is open, we could allow clicking map to add points via callback
                            onMapClick={(e) => {
                                if (isModalOpen) {
                                    // Optional: Add point logic on map click
                                    console.log('Map clicked at', e.lngLat);
                                }
                            }}
                        />
                    </div>
                </Card>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                        <DialogTitle>{currentRoute.id ? 'Edit Route' : 'Create New Route'}</DialogTitle>
                        <DialogDescription>
                            Define route details, stops, and geofencing configurations.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Form Column */}
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Route Name *</Label>
                                <Input
                                    id="name"
                                    value={currentRoute.name}
                                    onChange={(e) => setCurrentRoute({ ...currentRoute, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Unit *</Label>
                                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={currentRoute.description || ''}
                                    onChange={(e) => setCurrentRoute({ ...currentRoute, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="border p-4 rounded-lg bg-muted/50 space-y-4">
                                <h3 className="font-medium text-sm">Configuration</h3>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="checkpoints" className="cursor-pointer">Checkpoints Required</Label>
                                    <Switch
                                        id="checkpoints"
                                        checked={currentRoute.checkpointsRequired}
                                        onCheckedChange={(checked) => setCurrentRoute({ ...currentRoute, checkpointsRequired: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="geofence" className="cursor-pointer">Geofence Enabled</Label>
                                    <Switch
                                        id="geofence"
                                        checked={currentRoute.geofenceEnabled}
                                        onCheckedChange={(checked) => setCurrentRoute({ ...currentRoute, geofenceEnabled: checked })}
                                    />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor="radius">Default Radius (meters)</Label>
                                    <Input
                                        id="radius"
                                        type="number"
                                        value={currentRoute.defaultRadiusMeters}
                                        onChange={(e) => setCurrentRoute({ ...currentRoute, defaultRadiusMeters: parseInt(e.target.value) || 50 })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Setup Column */}
                        <div className="space-y-4 flex flex-col h-full">
                            <div className="flex justify-between items-center">
                                <Label className="text-lg font-semibold">Route Points</Label>
                                <Button variant="outline" size="sm" onClick={addPoint}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Point
                                </Button>
                            </div>

                            <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                                {/* Map Preview in Modal */}
                                <div className="h-48 border-b relative">
                                    <div className="absolute inset-0 bg-muted/20 z-0">
                                        <InteractiveMap
                                            points={currentRoute.points?.map(p => ({
                                                id: p.id || Math.random().toString(),
                                                latitude: p.latitude,
                                                longitude: p.longitude,
                                                label: p.name
                                            }))}
                                            readOnly
                                        />
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur px-2 py-1 text-xs rounded border pointer-events-none">
                                        Preview
                                    </div>
                                </div>

                                {/* Scrollable Points List */}
                                <div className="overflow-y-auto flex-1 p-2 space-y-2 max-h-[400px]">
                                    {currentRoute.points?.map((point, index) => (
                                        <div key={index} className="border p-3 rounded-md bg-card shadow-sm text-sm space-y-2">
                                            <div className="flex justify-between items-center border-b pb-2">
                                                <span className="font-bold text-muted-foreground">#{index + 1}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => removePoint(index)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Name</Label>
                                                    <Input
                                                        value={point.name}
                                                        onChange={(e) => updatePoint(index, 'name', e.target.value)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">Type</Label>
                                                    <Select value={point.type} onValueChange={(val) => updatePoint(index, 'type', val)}>
                                                        <SelectTrigger className="h-7 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="START">Start</SelectItem>
                                                            <SelectItem value="BOARDING">Boarding</SelectItem>
                                                            <SelectItem value="DEBARKATION">Debarkation</SelectItem>
                                                            <SelectItem value="END">End</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-4 space-y-1">
                                                    <Label className="text-xs">Search Address</Label>
                                                    <div className="flex gap-1">
                                                        <Input
                                                            placeholder="Type & Enter..."
                                                            className="h-8 text-xs"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAddressSearch(index, (e.currentTarget as HTMLInputElement).value);
                                                                }
                                                            }}
                                                        />
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                            handleAddressSearch(index, input.value);
                                                        }}>
                                                            <Search className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs">Lat</Label>
                                                    <Input
                                                        type="number"
                                                        value={point.latitude}
                                                        onChange={(e) => updatePoint(index, 'latitude', parseFloat(e.target.value))}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs">Lng</Label>
                                                    <Input
                                                        type="number"
                                                        value={point.longitude}
                                                        onChange={(e) => updatePoint(index, 'longitude', parseFloat(e.target.value))}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!currentRoute.points || currentRoute.points.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No points defined.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Route</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
