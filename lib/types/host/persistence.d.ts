import { z } from "zod";
declare const tableStateSchema: z.ZodObject<{
    tableId: z.ZodString;
    name: z.ZodString;
    maxSeats: z.ZodNumber;
    smallBlind: z.ZodNumber;
    bigBlind: z.ZodNumber;
    buyIn: z.ZodNumber;
    version: z.ZodNumber;
    createdAt: z.ZodNumber;
    seats: z.ZodArray<z.ZodNullable<z.ZodObject<{
        playerId: z.ZodString;
        nickname: z.ZodString;
        token: z.ZodString;
        stack: z.ZodNumber;
        connected: z.ZodBoolean;
        isBot: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodNumber;
        leaving: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
    dealerSeat: z.ZodNumber;
    hand: z.ZodNullable<z.ZodObject<{
        handId: z.ZodString;
        handNumber: z.ZodNumber;
        phase: z.ZodEnum<{
            preflop: "preflop";
            flop: "flop";
            turn: "turn";
            river: "river";
            showdown: "showdown";
        }>;
        deck: z.ZodArray<z.ZodObject<{
            rank: z.ZodNumber;
            suit: z.ZodNumber;
        }, z.core.$strip>>;
        holeCardsByPlayer: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            rank: z.ZodNumber;
            suit: z.ZodNumber;
        }, z.core.$strip>>>;
        community: z.ZodArray<z.ZodObject<{
            rank: z.ZodNumber;
            suit: z.ZodNumber;
        }, z.core.$strip>>;
        players: z.ZodArray<z.ZodObject<{
            seat: z.ZodNumber;
            playerId: z.ZodString;
            nickname: z.ZodString;
            holeCards: z.ZodArray<z.ZodObject<{
                rank: z.ZodNumber;
                suit: z.ZodNumber;
            }, z.core.$strip>>;
            startingStack: z.ZodNumber;
            stack: z.ZodNumber;
            bet: z.ZodNumber;
            committed: z.ZodNumber;
            folded: z.ZodBoolean;
            allIn: z.ZodBoolean;
            acted: z.ZodBoolean;
            excluded: z.ZodBoolean;
            lastAction: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<{
                    check: "check";
                    fold: "fold";
                    call: "call";
                    bet: "bet";
                    raise: "raise";
                    allin: "allin";
                }>;
                amount: z.ZodNumber;
                at: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        pots: z.ZodArray<z.ZodObject<{
            amount: z.ZodNumber;
            eligiblePlayerIds: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        toCall: z.ZodNumber;
        minRaise: z.ZodNumber;
        currentTurnSeat: z.ZodNumber;
        turnDeadlineAt: z.ZodNumber;
        lastAggressorIdx: z.ZodNumber;
        street: z.ZodNumber;
        startedAt: z.ZodNumber;
        finishedAt: z.ZodOptional<z.ZodNumber>;
        showdownRevealed: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    handNumber: z.ZodNumber;
    log: z.ZodArray<z.ZodObject<{
        at: z.ZodNumber;
        text: z.ZodString;
        handId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    appliedCommands: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
    actionTimeoutMs: z.ZodNumber;
    lastShowdown: z.ZodNullable<z.ZodObject<{
        handNumber: z.ZodNumber;
        handId: z.ZodString;
        reveal: z.ZodArray<z.ZodObject<{
            playerId: z.ZodString;
            nickname: z.ZodString;
            cards: z.ZodArray<z.ZodString>;
            handLabel: z.ZodString;
        }, z.core.$strip>>;
        winners: z.ZodArray<z.ZodObject<{
            playerId: z.ZodString;
            nickname: z.ZodString;
            amount: z.ZodNumber;
            handLabel: z.ZodString;
        }, z.core.$strip>>;
        at: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const pokerDomainSpec: {
    name: string;
    version: number;
    tables: {
        tables: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            tableId: string;
            name: string;
            maxSeats: number;
            smallBlind: number;
            bigBlind: number;
            buyIn: number;
            version: number;
            createdAt: number;
            seats: ({
                playerId: string;
                nickname: string;
                token: string;
                stack: number;
                connected: boolean;
                joinedAt: number;
                isBot?: boolean | undefined;
                leaving?: boolean | undefined;
            } | null)[];
            dealerSeat: number;
            hand: {
                handId: string;
                handNumber: number;
                phase: "preflop" | "flop" | "turn" | "river" | "showdown";
                deck: {
                    rank: number;
                    suit: number;
                }[];
                holeCardsByPlayer: Record<string, {
                    rank: number;
                    suit: number;
                }[]>;
                community: {
                    rank: number;
                    suit: number;
                }[];
                players: {
                    seat: number;
                    playerId: string;
                    nickname: string;
                    holeCards: {
                        rank: number;
                        suit: number;
                    }[];
                    startingStack: number;
                    stack: number;
                    bet: number;
                    committed: number;
                    folded: boolean;
                    allIn: boolean;
                    acted: boolean;
                    excluded: boolean;
                    lastAction?: {
                        type: "check" | "fold" | "call" | "bet" | "raise" | "allin";
                        amount: number;
                        at: number;
                    } | undefined;
                }[];
                pots: {
                    amount: number;
                    eligiblePlayerIds: string[];
                }[];
                toCall: number;
                minRaise: number;
                currentTurnSeat: number;
                turnDeadlineAt: number;
                lastAggressorIdx: number;
                street: number;
                startedAt: number;
                finishedAt?: number | undefined;
                showdownRevealed?: boolean | undefined;
            } | null;
            handNumber: number;
            log: {
                at: number;
                text: string;
                handId?: string | undefined;
            }[];
            appliedCommands: Record<string, string[]>;
            actionTimeoutMs: number;
            lastShowdown: {
                handNumber: number;
                handId: string;
                reveal: {
                    playerId: string;
                    nickname: string;
                    cards: string[];
                    handLabel: string;
                }[];
                winners: {
                    playerId: string;
                    nickname: string;
                    amount: number;
                    handLabel: string;
                }[];
                at: number;
            } | null;
        }>;
        ledger: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            transactionId: string;
            playerId: string;
            tableId: string | null;
            handId: string | null;
            amount: number;
            reason: "grant" | "buy-in" | "cash-out" | "hand-result";
            createdAt: number;
        }>;
        players: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            playerId: string;
            token: string;
            nickname: string;
            createdAt: number;
        }>;
    };
};
export { tableStateSchema };
export type PersistedTableState = z.infer<typeof tableStateSchema>;
