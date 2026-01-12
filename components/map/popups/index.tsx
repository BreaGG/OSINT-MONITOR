import { renderToStaticMarkup } from "react-dom/server"
import { Event } from "@/lib/types"
import { categoryColors } from "@/lib/categoryColors"

/* ===================== BASE POPUP WRAPPER ===================== */

function PopupWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                padding: "12px",
                maxWidth: "280px",
                fontSize: "13px",
                lineHeight: "1.3",
            }}
        >
            {children}
        </div>
    )
}

/* ===================== EVENT POPUP ===================== */

type EventPopupProps = {
    title: string
    country: string
    category: string
}

function EventPopupContent({ title, country, category }: EventPopupProps) {
    const categoryInfo = categoryColors[category as keyof typeof categoryColors]

    return (
        <PopupWrapper>
            <div style={{ fontSize: "12px" }}>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{title}</div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{country}</div>
                <div
                    style={{
                        fontSize: "11px",
                        color: categoryInfo?.color || "#9ca3af",
                        marginTop: "4px",
                    }}
                >
                    {categoryInfo?.label || category}
                </div>
            </div>
        </PopupWrapper>
    )
}

/* ===================== CAPITAL POPUP ===================== */

type CapitalPopupProps = {
    name: string
    status: string
    summary: string
    entities: string
}

function CapitalPopupContent({
    name,
    status,
    summary,
    entities,
}: CapitalPopupProps) {
    return (
        <PopupWrapper>
            <div style={{ fontSize: "12px" }}>
                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                    }}
                >
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{name}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{status}</div>
                </div>

                {/* SUMMARY */}
                <div style={{ fontSize: "11px", color: "#d1d5db", marginBottom: "6px" }}>
                    {summary}
                </div>

                <div
                    style={{
                        height: "1px",
                        background: "#e5e7eb",
                        opacity: 0.25,
                        margin: "6px 0",
                    }}
                />

                {/* ENTITIES */}
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#9ca3af" }}>Key entities</span>
                    <br />
                    {entities}
                </div>
            </div>
        </PopupWrapper>
    )
}

/* ===================== CHOKEPOINT POPUP ===================== */

type ChokepointPopupProps = {
    name: string
    status: string
    summary: string
}

function ChokepointPopupContent({
    name,
    status,
    summary,
}: ChokepointPopupProps) {
    return (
        <PopupWrapper>
            <div style={{ fontSize: "12px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                    }}
                >
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{name}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{status}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#d1d5db" }}>{summary}</div>
            </div>
        </PopupWrapper>
    )
}

/* ===================== CONFLICT POPUP ===================== */

type ConflictPopupProps = {
    name: string
    startDate: string
    level: string
    casualties: string
    displaced: string
    description: string
    belligerents: string
}

function ConflictPopupContent({
    name,
    startDate,
    level,
    casualties,
    displaced,
    description,
    belligerents,
}: ConflictPopupProps) {
    return (
        <PopupWrapper>
            <div style={{ fontSize: "12px" }}>
                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                    }}
                >
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{name}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{startDate}</div>
                </div>

                <div
                    style={{ color: "#fca5a5", fontSize: "11px", marginBottom: "6px" }}
                >
                    {level} intensity
                </div>

                <div
                    style={{
                        height: "1px",
                        background: "#e5e7eb",
                        opacity: 0.25,
                        margin: "6px 0",
                    }}
                />

                {/* METRICS */}
                <div style={{ marginBottom: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#9ca3af" }}>Casualties</span>
                        <span>{casualties}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#9ca3af" }}>Displaced</span>
                        <span>{displaced}</span>
                    </div>
                </div>

                <div
                    style={{
                        height: "1px",
                        background: "#e5e7eb",
                        opacity: 0.25,
                        margin: "6px 0",
                    }}
                />

                {/* DESCRIPTION */}
                <div
                    style={{ color: "#d1d5db", fontSize: "11px", marginBottom: "6px" }}
                >
                    {description}
                </div>

                <div
                    style={{
                        height: "1px",
                        background: "#e5e7eb",
                        opacity: 0.25,
                        margin: "6px 0",
                    }}
                />

                {/* BELLIGERENTS */}
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#9ca3af" }}>Belligerents</span>
                    <br />
                    {belligerents.split(",").map(b => b.trim()).join(" · ")}
                </div>
            </div>
        </PopupWrapper>
    )
}

/* ===================== MILITARY BASE POPUP ===================== */

type MilitaryBasePopupProps = {
    name: string
    country: string
    description: string
    significance: string
}

function MilitaryBasePopupContent({
    name,
    country,
    description,
    significance,
}: MilitaryBasePopupProps) {
    return (
        <PopupWrapper>
            <div style={{ fontSize: "12px" }}>
                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                    }}
                >
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{name}</div>
                    <div
                        style={{
                            fontSize: "11px",
                            color: "#c4b5fd",
                            whiteSpace: "nowrap",
                        }}
                    >
                        MILITARY BASE
                    </div>
                </div>

                {/* LOCATION */}
                <div style={{ fontSize: "11px", color: "#d1d5db", marginBottom: "6px" }}>
                    {country}
                </div>

                <div
                    style={{
                        height: "1px",
                        background: "#e5e7eb",
                        opacity: 0.25,
                        margin: "6px 0",
                    }}
                />

                {/* DESCRIPTION */}
                <div style={{ fontSize: "11px", color: "#d1d5db", marginBottom: "6px" }}>
                    {description}
                </div>

                <div
                    style={{
                        height: "1px",
                        background: "#e5e7eb",
                        opacity: 0.25,
                        margin: "6px 0",
                    }}
                />

                {/* SIGNIFICANCE */}
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#9ca3af" }}>Strategic significance</span>
                    <br />
                    {significance}
                </div>
            </div>
        </PopupWrapper>
    )
}

/* ===================== RENDER HELPERS ===================== */

export const renderEventPopup = (props: EventPopupProps): string =>
    renderToStaticMarkup(<EventPopupContent {...props} />)

export const renderCapitalPopup = (props: CapitalPopupProps): string =>
    renderToStaticMarkup(<CapitalPopupContent {...props} />)

export const renderChokepointPopup = (props: ChokepointPopupProps): string =>
    renderToStaticMarkup(<ChokepointPopupContent {...props} />)

export const renderConflictPopup = (props: ConflictPopupProps): string =>
    renderToStaticMarkup(<ConflictPopupContent {...props} />)

export const renderMilitaryBasePopup = (props: MilitaryBasePopupProps): string =>
    renderToStaticMarkup(<MilitaryBasePopupContent {...props} />)