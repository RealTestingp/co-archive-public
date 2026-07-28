/* CharacterPage.tsx
   The detail view for one role, at /characters/:id.

   A character belongs to an opera, not to a production, which is the thing
   worth understanding here. Cio-Cio-San is a role in Madama Butterfly, and
   every staging of that opera reuses the same character record rather than
   creating its own. That is what makes the interesting question answerable:
   everyone who has ever sung this role, across every production.

   So this page is the third view of the same appearances join. ProductionPage
   reads it by production, PersonPage by person, and this one by character.
*/
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Breadcrumb from "../components/ui/BreadCrumb";
import PageHeader from "../components/ui/PageHeader";
import DetailRow from "../components/ui/DetailRow";
import SectionTitle from "../components/ui/SectionTitle";
import Divider from "../components/ui/Divider";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorState from "../components/ui/ErrorState";
import EditCharacterModal from "../components/modals/EditCharacterModal";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../auth";
import { api } from "../api";

interface Performer {
  firstName: string;
  lastName: string;
  contributorType: string;
}

interface ProductionHistory {
  productionId: number;
  productionTitle: string;
  season: string;
  performers: Performer[];
}

interface Character {
  id: number;
  name: string;
  opera: string;
  operaId: number | null;
  productionHistory: ProductionHistory[];
}

const CharacterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark, colors } = useTheme();
  const { isAdmin } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const fetchCharacter = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await api.get(`/api/characters/${id}`);
      if (!res.ok) throw new Error();
      setCharacter(await res.json());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  const details = character
    ? [
        { label: "Opera", value: character.opera ?? "—" },
        {
          label: "Productions",
          value: String(character.productionHistory.length),
        },
      ]
    : [];

  const border = isDark ? "#2a2a2a" : "#e5e7eb";
  const borderLight = isDark ? "#2a2a2a" : "#f3f4f6";
  const textPrimary = colors.textPrimary;
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const tableBg = isDark ? "#161616" : "#f9fafb";

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
            { label: "Characters", to: "/search" },
          ]}
          current={character?.name ?? "Character"}
        />

        {hasError ? (
          <ErrorState onRetry={fetchCharacter} />
        ) : (
          <>
            {/* Header */}
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
              // Editing is admin-only — omitting onEdit hides the button.
              // No onDelete yet (no DeleteCharacterModal), so PageHeader
              // renders just the edit action.
              <PageHeader
                title={character!.name}
                subtitle={character!.opera ?? ""}
                editLabel="Edit Character"
                onEdit={isAdmin ? () => setShowEditModal(true) : undefined}
              />
            )}

            <Divider />

            {/* Details */}
            {isLoading ? (
              <div
                style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem" }}
              >
                {[1, 2].map((i) => (
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

            {/* Production History */}
            <SectionTitle>Production History</SectionTitle>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${borderLight}`,
                  }}
                >
                  <LoadingSkeleton width="200px" height="13px" />
                </div>
              ))
            ) : !character || character.productionHistory.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: textMuted,
                  marginBottom: "1.5rem",
                }}
              >
                No production history on record.
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
                  {["Production", "Season", "Performers"].map((h) => (
                    <span
                      key={h}
                      style={{
                        flex: 1,
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.08em",
                        color: textMuted,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {character.productionHistory.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "11px 16px",
                      borderBottom:
                        i < character.productionHistory.length - 1
                          ? `1px solid ${borderLight}`
                          : "none",
                    }}
                  >
                    {/* The title is the link — same red + underline-on-hover
                        behaviour as every other link in the app. */}
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/productions/${p.productionId}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/productions/${p.productionId}`);
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
                        // Link uses primary ink, not red — hover underline signals it.
                        color: textPrimary,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {p.productionTitle}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "13px",
                        color: textSecondary,
                      }}
                    >
                      {p.season}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "13px",
                        color: textSecondary,
                      }}
                    >
                      {p.performers
                        .map((perf) => `${perf.firstName} ${perf.lastName}`)
                        .join(", ") || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {character && (
        <EditCharacterModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          character={character}
          onSuccess={() => {
            setShowEditModal(false);
            fetchCharacter();
          }}
        />
      )}
    </div>
  );
};

export default CharacterPage;