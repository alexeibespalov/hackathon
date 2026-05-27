export type AppEnv = {
	Bindings: Env;
};

export type ProductType = 'PARKING' | 'FAST_TRACK' | 'LOUNGE';

export type ProductSummary = {
	id: string;
	name: string;
	type: ProductType;
	description: string;
	location: string;
	capacity: number;
	slotDurationMins: number;
	timezone: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ScheduleSummary = {
	id: string;
	productId: string;
	startTime: string;
	endTime: string;
	daysOfWeek: number[];
	validFrom: string;
	validUntil: string | null;
	slotIntervalMins: number;
	createdAt: string;
	updatedAt: string;
};

export type SlotSummary = {
	id: string;
	scheduleId: string;
	productId: string;
	date: string;
	startTime: string;
	endTime: string;
	totalCapacity: number;
	bookedCount: number;
	status: 'AVAILABLE' | 'FULL' | 'BLOCKED';
	createdAt: string;
};

export type SlotGenerationPlan = {
	productId: string;
	fromDate: string;
	toDate: string;
	replaceExisting: boolean;
	timezone: string;
	scheduleIds: string[];
	candidateSlots: number;
	existingSlots: number;
	slotsToCreate: number;
	slotsToDelete: number;
	protectedSlots: Array<{
		id: string;
		date: string;
		startTime: string;
		bookings: number;
		waitlist: number;
	}>;
};

export type ApiPlaceholderResponse = {
	message: string;
	status: 'pending';
};