/* PersonPage.tsx
   The detail view for one artist or contributor, at /persons/:id.

   Shows their details and every production they have appeared in. That list is
   the point of the page and the reason the archive exists: from one performer
   you can see their whole history with the company, which is the question staff
   most often need answered.

   The appearance list is the same join table read from the other direction.
   ProductionPage asks "who was in this production", this page asks "what was
   this person in". One relationship, two views, which is why neither needed its
   own endpoint or table.

   Every production in that list links onward, so someone can move from a person
   to a production to another performer without ever going back to search.

   Edit and delete are admin only and gated on useAuth().isAdmin, which hides
   the buttons rather than securing the action.
*/
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/ui/BreadCrumb";
import DetailRow from "../components/ui/DetailRow";
import SectionTitle from "../components/ui/SectionTitle";
import Divider from "../components/ui/Divider";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorState from "../components/ui/ErrorState";
import EditPersonModal from "../components/modals/EditPersonModal";
import DeletePersonModal from "../components/modals/DeletePersonModal";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth";
import { api } from "../api";

interface Appearance {
  productionId: number;
  productionTitle: string;
  season: string;
  eventType: string;
  roles: {
    contributorType: string;
    character: string | null;
    position: string | null;
  }[];
}

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  // NOTE: added so the edit modal can pre-fill it. Confirm GET
  // /api/persons/{id} actually returns this field — AddPersonModal already
  // sends middleName on create, so the backend model very likely has it,
  // this just wasn't declared on the detail-page type before now.
  middleName: string | null;
  email: string | null;
  isActive: boolean;
  profileImageUrl: string | null;
  voiceType: string | null;
  nationalities: string[];
  contributorTypes: string[];
  appearances: Appearance[];
  mainStageProductionCount: number;
  performanceCount: number;
}

const PersonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark, colors } = useTheme();
  const { isAdmin } = useAuth();

  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPerson = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await api.get(`/api/persons/${id}`);
      if (!res.ok) throw new Error();
      setPerson(await res.json());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  const handleDeleteConfirm = async () => {
    if (!person) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await api.delete(`/api/persons/${person.id}`);
      if (!res.ok) {
        // Surface whatever message the backend sends (e.g. a 409 if the
        // person can't be deleted because they have production credits),
        // falling back to a generic message if the response isn't JSON.
        let message = "Failed to delete this person. Please try again.";
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
          : "Failed to delete this person. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const fullName = person ? `${person.firstName} ${person.lastName}` : "Person";
  const initials = person
    ? `${person.firstName[0]}${person.lastName[0]}`.toUpperCase()
    : "";

  const details = person
    ? [
        { label: "Email", value: person.email || "—" },
        { label: "Voice Type", value: person.voiceType ?? "—" },
        { label: "Nationality", value: person.nationalities.join(", ") || "—" },
        {
          label: "Contributor Type",
          value: person.contributorTypes.join(", ") || "—",
        },
        { label: "Status", value: person.isActive ? "Active" : "Inactive" },
      ]
    : [];

  const metrics = person
    ? [
        { label: "Performances", value: person.performanceCount },
        { label: "Productions", value: person.mainStageProductionCount },
        {
          label: "Seasons Active",
          value: new Set(person.appearances.map((a) => a.season)).size,
        },
      ]
    : [];

  // Theme-aware colours
  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const surface = isDark ? "#1c1c1c" : "#fff";
  const tableBg = isDark ? "#161616" : "#f9fafb";
  const metricBg = isDark ? "#1c1c1c" : "#fff";
  const metricDivider = isDark ? "#2a2a2a" : "#e5e7eb";
  const deleteBorder = isDark ? "#4a2020" : "#fecaca";

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
            { label: "Persons", to: "/search" },
          ]}
          current={fullName}
        />

        {hasError ? (
          <ErrorState onRetry={fetchPerson} />
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                {/* Avatar — display only. Initials are a decorative accent. */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: `1.5px solid ${isDark ? "#3a3a3a" : "#e5e7eb"}`,
                    background: isDark ? "#2a2a2a" : "#f3e8e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {person?.profileImageUrl ? (
                    <img
                      src={person.profileImageUrl}
                      alt={fullName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#9B1C1C",
                        fontWeight: 500,
                      }}
                    >
                      {isLoading ? "" : initials}
                    </span>
                  )}
                </div>

                {/* Name + subtitle */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {isLoading ? (
                    <LoadingSkeleton width="200px" height="26px" />
                  ) : (
                    <h1
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: textPrimary,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {fullName}
                    </h1>
                  )}
                  {isLoading ? (
                    <LoadingSkeleton width="140px" height="14px" />
                  ) : (
                    <div style={{ fontSize: "13px", color: textSecondary }}>
                      {person?.contributorTypes.join(", ") || "—"}
                      {person?.nationalities.length
                        ? ` · ${person.nationalities.join(", ")}`
                        : ""}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {/* Editing and deleting are admin-only */}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      disabled={!person}
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        padding: "7px 14px",
                        borderRadius: "6px",
                        cursor: person ? "pointer" : "default",
                        border: "1px solid #9B1C1C",
                        background: "#9B1C1C",
                        color: "#fff",
                        fontFamily: "Inter, sans-serif",
                        opacity: person ? 1 : 0.6,
                      }}
                    >
                      Edit Profile
                    </button>
                    {/* Delete keeps red as a destructive-action signal. */}
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={!person}
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        padding: "7px 14px",
                        borderRadius: "6px",
                        cursor: person ? "pointer" : "default",
                        border: `1px solid ${deleteBorder}`,
                        background: surface,
                        color: "#9B1C1C",
                        fontFamily: "Inter, sans-serif",
                        opacity: person ? 1 : 0.6,
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            <Divider />

            {/* Details */}
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
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

            <Divider />

            {/* Milestone Metrics */}
            {!isLoading && person && (
              <>
                <SectionTitle>Milestones</SectionTitle>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1px",
                    background: metricDivider,
                    border: `1px solid ${border}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    marginBottom: "1.5rem",
                  }}
                >
                  {metrics.map((m) => (
                    <div
                      key={m.label}
                      style={{ background: metricBg, padding: "1.25rem" }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: 700,
                          color: textPrimary,
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                          marginBottom: "4px",
                        }}
                      >
                        {m.value}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: textMuted,
                        }}
                      >
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {isLoading && (
              <>
                <div style={{ height: "16px", marginBottom: "0.75rem" }}>
                  <LoadingSkeleton width="100px" height="13px" />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1px",
                    marginBottom: "1.5rem",
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <LoadingSkeleton key={i} width="100%" height="72px" />
                  ))}
                </div>
              </>
            )}

            <Divider />

            {/* Production History */}
            <SectionTitle>Production History</SectionTitle>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: `1px solid ${borderLight}`,
                  }}
                >
                  <LoadingSkeleton width="200px" height="13px" />
                  <LoadingSkeleton width="80px" height="13px" />
                </div>
              ))
            ) : !person || person.appearances.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: textMuted,
                  marginBottom: "1.5rem",
                }}
              >
                No productions on record.
              </p>
            ) : (
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
                  {["Production", "Season", "Role"].map((h) => (
                    <span
                      key={h}
                      style={{
                        flex: 1,
                        fontSize: "10px",
                        fontWeight: 500,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.08em",
                        color: textMuted,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {person.appearances.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "11px 16px",
                      borderBottom:
                        i < person.appearances.length - 1
                          ? `1px solid ${borderLight}`
                          : "none",
                    }}
                  >
                    {/* Title link — primary ink, not red; hover underlines it. */}
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/productions/${a.productionId}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/productions/${a.productionId}`);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                      style={{
                        flex: 1,
                        fontSize: "13px",
                        fontWeight: 500,
                        color: textPrimary,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {a.productionTitle}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "13px",
                        color: textSecondary,
                      }}
                    >
                      {a.season}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "13px",
                        color: textSecondary,
                      }}
                    >
                      {a.roles
                        .map(
                          (r) => r.character ?? r.position ?? r.contributorType,
                        )
                        .join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {person && (
        <>
          <EditPersonModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            person={person}
            onSuccess={() => {
              setShowEditModal(false);
              fetchPerson();
            }}
          />
          <DeletePersonModal
            isOpen={showDeleteModal}
            personName={fullName}
            productionCount={person.mainStageProductionCount}
            onCancel={() => {
              setShowDeleteModal(false);
              setDeleteError(null);
            }}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
            error={deleteError}
          />
        </>
      )}
    </div>
  );
};

export default PersonPage;