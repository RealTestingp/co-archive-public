using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace COArchive.Migrations
{
    /// <inheritdoc />
    public partial class RenameEventToProduction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appearances_Events_EventId",
                table: "Appearances");

            migrationBuilder.DropForeignKey(
                name: "FK_Performances_Events_EventId",
                table: "Performances");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Performances",
                newName: "ProductionId");

            migrationBuilder.RenameIndex(
                name: "IX_Performances_EventId",
                table: "Performances",
                newName: "IX_Performances_ProductionId");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Appearances",
                newName: "ProductionId");

            migrationBuilder.RenameIndex(
                name: "IX_Appearances_EventId",
                table: "Appearances",
                newName: "IX_Appearances_ProductionId");

            migrationBuilder.CreateTable(
                name: "Productions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SeasonId = table.Column<int>(type: "int", nullable: false),
                    EventTypeId = table.Column<int>(type: "int", nullable: false),
                    VenueId = table.Column<int>(type: "int", nullable: false),
                    OperaId = table.Column<int>(type: "int", nullable: true),
                    WrittenLanguageId = table.Column<int>(type: "int", nullable: true),
                    SungLanguageId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RuntimeMinutes = table.Column<int>(type: "int", nullable: false),
                    ProgramPdfUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Productions_EventTypes_EventTypeId",
                        column: x => x.EventTypeId,
                        principalTable: "EventTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productions_Languages_SungLanguageId",
                        column: x => x.SungLanguageId,
                        principalTable: "Languages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productions_Languages_WrittenLanguageId",
                        column: x => x.WrittenLanguageId,
                        principalTable: "Languages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productions_Operas_OperaId",
                        column: x => x.OperaId,
                        principalTable: "Operas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productions_Seasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "Seasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Productions_Venues_VenueId",
                        column: x => x.VenueId,
                        principalTable: "Venues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Productions_EventTypeId",
                table: "Productions",
                column: "EventTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Productions_OperaId",
                table: "Productions",
                column: "OperaId");

            migrationBuilder.CreateIndex(
                name: "IX_Productions_SeasonId",
                table: "Productions",
                column: "SeasonId");

            migrationBuilder.CreateIndex(
                name: "IX_Productions_SungLanguageId",
                table: "Productions",
                column: "SungLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Productions_VenueId",
                table: "Productions",
                column: "VenueId");

            migrationBuilder.CreateIndex(
                name: "IX_Productions_WrittenLanguageId",
                table: "Productions",
                column: "WrittenLanguageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appearances_Productions_ProductionId",
                table: "Appearances",
                column: "ProductionId",
                principalTable: "Productions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Performances_Productions_ProductionId",
                table: "Performances",
                column: "ProductionId",
                principalTable: "Productions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appearances_Productions_ProductionId",
                table: "Appearances");

            migrationBuilder.DropForeignKey(
                name: "FK_Performances_Productions_ProductionId",
                table: "Performances");

            migrationBuilder.DropTable(
                name: "Productions");

            migrationBuilder.RenameColumn(
                name: "ProductionId",
                table: "Performances",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Performances_ProductionId",
                table: "Performances",
                newName: "IX_Performances_EventId");

            migrationBuilder.RenameColumn(
                name: "ProductionId",
                table: "Appearances",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Appearances_ProductionId",
                table: "Appearances",
                newName: "IX_Appearances_EventId");

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventTypeId = table.Column<int>(type: "int", nullable: false),
                    OperaId = table.Column<int>(type: "int", nullable: true),
                    SeasonId = table.Column<int>(type: "int", nullable: false),
                    SungLanguageId = table.Column<int>(type: "int", nullable: true),
                    VenueId = table.Column<int>(type: "int", nullable: false),
                    WrittenLanguageId = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ProgramPdfUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RuntimeMinutes = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_EventTypes_EventTypeId",
                        column: x => x.EventTypeId,
                        principalTable: "EventTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Events_Languages_SungLanguageId",
                        column: x => x.SungLanguageId,
                        principalTable: "Languages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Events_Languages_WrittenLanguageId",
                        column: x => x.WrittenLanguageId,
                        principalTable: "Languages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Events_Operas_OperaId",
                        column: x => x.OperaId,
                        principalTable: "Operas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Events_Seasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "Seasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Events_Venues_VenueId",
                        column: x => x.VenueId,
                        principalTable: "Venues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_EventTypeId",
                table: "Events",
                column: "EventTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_OperaId",
                table: "Events",
                column: "OperaId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SeasonId",
                table: "Events",
                column: "SeasonId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SungLanguageId",
                table: "Events",
                column: "SungLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_VenueId",
                table: "Events",
                column: "VenueId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_WrittenLanguageId",
                table: "Events",
                column: "WrittenLanguageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appearances_Events_EventId",
                table: "Appearances",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Performances_Events_EventId",
                table: "Performances",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
