import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/ui/BreadCrumb";
import PageHeader from "../components/ui/PageHeader";
import DetailRow from "../components/ui/DetailRow";
import SectionTitle from "../components/ui/SectionTitle";
import Divider from "../components/ui/Divider";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorState from "../components/ui/ErrorState";
import EditProductionModal from "../components/modals/EditProductionModal";
import DeleteProductionModal from "../components/modals/DeleteProductionModal";
import ProgramPdfPreview from "../components/ProgramPdfPreview";
import ManageCastModal from "../components/modals/ManageCastModal";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth";
import { api } from "../api";

interface Performance {
  id: number;
  date: string;
}

interface CastMember {
  // Returned by GET /api/productions/{id} — needed to DELETE the appearance.
  appearanceId?: number;
  personId?: number;
  firstName: string;
  lastName: string;
  contributorType: string;
  characterId?: number | null;
  character: string | null;
  position: string | null;
}

interface CrewMember {
  personId?: number;
  firstName: string;
  lastName: string;
  position: string | null;
}

interface EnsembleMember {
  personId?: number;
  firstName: string;
  lastName: string;
}

interface Production {
  id: number;
  title: string;
  season: string;
  eventType: string;
  venue: string;
  opera: string | null;
  // Now returned by GET /api/productions/{id} — used to load/add characters.
  operaId: number | null;
  composers: string[];
  librettists: string[];
  writtenLanguage: string | null;
  sungLanguage: string | null;
  runtimeMinutes: number | null;
  notes: string | null;
  programPdfUrl: string | null;
  performances: Performance[];
  cast: CastMember[];
  creative: CrewMember[];
  crew: CrewMember[];
  orchestra: EnsembleMember[];
  chorus: EnsembleMember[];
}

// McPhee is a program membership the API surfaces as a contributor type on a
// cast appearance. It carries no character, so left in the Cast table it
// renders as a bare "—" beside the person's real (Artist) credit. We split it
// into its own section instead. Same keyword-match approach ReportsPage uses.
const isMcPhee = (contributorType?: string) =>
  !!contributorType && /mcphee/i.test(contributorType);

const ProductionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark, colors } = useTheme();
  const { isAdmin } = useAuth();
  const [production, setProduction] = useState<Production | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManageCast, setShowManageCast] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProduction = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await api.get(`/api/productions/${id}`);
      if (!res.ok) throw new Error();
      setProduction(await res.json());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduction();
  }, [id]);

  const handleDeleteConfirm = async () => {
    if (!production) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await api.delete(`/api/productions/${production.id}`);
      if (!res.ok) {
        let message = "Failed to delete this production. Please try again.";
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          // not JSON — keep generic message
        }
        throw new Error(message);
      }
      navigate("/search");
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete this production. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Theme tokens
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const tableBg = isDark ? "#161616" : "#f9fafb";
  const chipBg = isDark ? "#2a2a2a" : "#f3f4f6";
  const chipColor = isDark ? "#9ca3af" : "#374151";

  // Shared clickable-name style for anything that links to another record.
  const linkCell = (onClick: () => void, label: string, flex: number) => (
    <span
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = "none";
      }}
      style={{
        flex,
        fontSize: "13px",
        // Links use the primary ink colour, not red — the underline-on-hover
        // and pointer cursor carry the "clickable" signal instead.
        fontWeight: 500,
        color: textPrimary,
        cursor: "pointer",
        outline: "none",
      }}
    >
      {label}
    </span>
  );

  const details = production
    ? [
        { label: "Composer", value: production.composers.join(", ") || "—" },
        {
          label: "Librettist(s)",
          value: production.librettists.join(", ") || "—",
        },
        { label: "Written Language", value: production.writtenLanguage ?? "—" },
        { label: "Sung Language", value: production.sungLanguage ?? "—" },
        {
          label: "Runtime",
          value: production.runtimeMinutes
            ? `${production.runtimeMinutes} min`
            : "—",
        },
        { label: "Venue", value: production.venue },
        { label: "Event Type", value: production.eventType },
        { label: "Season", value: production.season },
      ]
    : [];

  // Split McPhee appearances out of Cast so they get their own section rather
  // than showing as a role-less duplicate row in the Cast table.
  const castMembers = production
    ? production.cast.filter((m) => !isMcPhee(m.contributorType))
    : [];
  const mcpheeMembers = production
    ? production.cast.filter((m) => isMcPhee(m.contributorType))
    : [];

  const personnelCount = production
    ? production.cast.length +
      production.creative.length +
      production.crew.length +
      production.orchestra.length +
      production.chorus.length
    : 0;
  const performanceCount = production ? production.performances.length : 0;

  const headerCell: React.CSSProperties = {
    flex: 1,
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textMuted,
  };

  const renderPersonTable = (
    members: {
      personId?: number;
      firstName: string;
      lastName: string;
      position?: string | null;
      characterId?: number | null;
      character?: string | null;
      contributorType?: string;
    }[],
    showRole = false,
  ) => (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: "8px",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "8px 16px",
          background: tableBg,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <span style={headerCell}>Name</span>
        {showRole && <span style={headerCell}>Character / Position</span>}
      </div>
      {members.length === 0 ? (
        <div
          style={{ padding: "1rem 16px", fontSize: "13px", color: textMuted }}
        >
          None listed.
        </div>
      ) : (
        members.map((m, i) => {
          const name = `${m.lastName}, ${m.firstName}`;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "11px 16px",
                borderBottom:
                  i < members.length - 1 ? `1px solid ${borderLight}` : "none",
                background: "transparent",
              }}
            >
              {/* Person — links to their profile */}
              {m.personId != null ? (
                linkCell(() => navigate(`/persons/${m.personId}`), name, 1)
              ) : (
                <span
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    fontWeight: 500,
                    color: textPrimary,
                  }}
                >
                  {name}
                </span>
              )}

              {/* Character (links) or position (plain text) */}
              {showRole &&
                (m.characterId != null && m.character ? (
                  linkCell(
                    () => navigate(`/characters/${m.characterId}`),
                    m.character,
                    1,
                  )
                ) : (
                  <span
                    style={{ flex: 1, fontSize: "13px", color: textSecondary }}
                  >
                    {m.character ?? m.position ?? "—"}
                  </span>
                ))}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div
      style={{
        background: colors.background,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        color: textPrimary,
      }}
    >
      <NavBar />
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem" }}>
        <Breadcrumb
          path={[
            { label: "Archive", to: "/search" },
            { label: "Productions", to: "/search" },
          ]}
          current={production?.title ?? "Production"}
        />

        {hasError ? (
          <ErrorState onRetry={fetchProduction} />
        ) : (<>
            {/* Header — the program thumbnail sits to the left of the title,
                the same relationship the profile photo has on PersonPage.
                Renders nothing when the production has no PDF, so the title
                falls back flush left. */}
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
            >
              {!isLoading && production?.programPdfUrl && (
                <ProgramPdfPreview
                  url={production.programPdfUrl}
                  title={production.title}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {isLoading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <LoadingSkeleton width="280px" height="26px" />
                    <LoadingSkeleton width="160px" height="14px" />
                  </div>
                ) : (
                  <PageHeader
                    title={production!.title}
                    subtitle={`${production!.season} · ${production!.eventType}`}
                    editLabel="Edit Production"
                    onEdit={isAdmin ? () => setShowEditModal(true) : undefined}
                    onDelete={
                      isAdmin ? () => setShowDeleteModal(true) : undefined
                    }
                  />
                )}
              </div>
            </div>

            <Divider />

            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <LoadingSkeleton width="80px" height="10px" />
                    <LoadingSkeleton width="60px" height="14px" />
                  </div>
                ))}
              </div>
            ) : (
              <DetailRow details={details} />
            )}

            {/* Performance Dates */}
            {!isLoading && production && production.performances.length > 0 && (
              <>
                <Divider />
                <SectionTitle>Performance Dates</SectionTitle>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "1.5rem",
                  }}
                >
                  {production.performances.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        padding: "4px 10px",
                        borderRadius: "4px",
                        background: chipBg,
                        color: chipColor,
                        border: `1px solid ${border}`,
                      }}
                    >
                      {new Date(p.date).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ))}
                </div>
              </>
            )}

            <Divider />

            {isLoading ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <LoadingSkeleton key={i} width="100%" height="40px" />
                ))}
              </div>
            ) : (
              production && (
                <>
                  {/* Admin-only: assign / add / remove cast after creation. */}
                  {isAdmin && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <button
                        onClick={() => setShowManageCast(true)}
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          padding: "7px 14px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          border: `1px solid ${border}`,
                          background: "transparent",
                          color: textPrimary,
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Manage Cast
                      </button>
                    </div>
                  )}
                  {castMembers.length > 0 && (
                    <>
                      <SectionTitle>Cast</SectionTitle>
                      {renderPersonTable(castMembers, true)}
                    </>
                  )}
                  {production.creative.length > 0 && (
                    <>
                      <SectionTitle>Creative Team</SectionTitle>
                      {renderPersonTable(production.creative, true)}
                    </>
                  )}
                  {production.crew.length > 0 && (
                    <>
                      <SectionTitle>Crew</SectionTitle>
                      {renderPersonTable(production.crew, true)}
                    </>
                  )}
                  {production.orchestra.length > 0 && (
                    <>
                      <SectionTitle>Orchestra</SectionTitle>
                      {renderPersonTable(production.orchestra, false)}
                    </>
                  )}
                  {production.chorus.length > 0 && (
                    <>
                      <SectionTitle>Chorus</SectionTitle>
                      {renderPersonTable(production.chorus, false)}
                    </>
                  )}
                  {/* McPhee artists — a program membership, listed by name.
                      Their character (if any) shows under Cast via their
                      Artist appearance, so this section is names only. */}
                  {mcpheeMembers.length > 0 && (
                    <>
                      <SectionTitle>McPhee Artists</SectionTitle>
                      {renderPersonTable(mcpheeMembers, false)}
                    </>
                  )}
                  {production.notes && (
                    <>
                      <Divider />
                      <SectionTitle>Notes</SectionTitle>
                      <p
                        style={{
                          fontSize: "13px",
                          color: textSecondary,
                          lineHeight: 1.6,
                        }}
                      >
                        {production.notes}
                      </p>
                    </>
                  )}
                </>
              )
            )}
          </>
        )}
      </div>

      {production && (
        <>
          <EditProductionModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            production={production}
            onSuccess={() => {
              setShowEditModal(false);
              fetchProduction();
            }}
          />
          <DeleteProductionModal
            isOpen={showDeleteModal}
            productionTitle={production.title}
            performanceCount={performanceCount}
            personnelCount={personnelCount}
            onCancel={() => {
              setShowDeleteModal(false);
              setDeleteError(null);
            }}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
            error={deleteError}
          />
          <ManageCastModal
            isOpen={showManageCast}
            onClose={() => setShowManageCast(false)}
            productionId={production.id}
            productionTitle={production.title}
            operaId={production.operaId}
            cast={production.cast}
            // Refetch so the current-cast list and the page stay in sync after
            // any add/remove — modal stays open for further edits.
            onChanged={fetchProduction}
          />
        </>
      )}
    </div>
  );
};

export default ProductionPage;