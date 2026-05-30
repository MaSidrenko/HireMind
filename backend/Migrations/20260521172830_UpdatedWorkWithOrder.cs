using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedWorkWithOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Currency",
                table: "Proposals",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDays",
                table: "Proposals",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Proposals",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "AiGenerated",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ClientApproved",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "FreelancerApproved",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ReadinessScore",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TechnicalSpecification",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "WorkflowStage",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ClarificationQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderID = table.Column<int>(type: "integer", nullable: false),
                    Question = table.Column<string>(type: "text", nullable: false),
                    RiskLevel = table.Column<int>(type: "integer", nullable: false),
                    Answer = table.Column<string>(type: "text", nullable: false),
                    Options = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClarificationQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClarificationQuestions_Orders_OrderID",
                        column: x => x.OrderID,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DoneCriteria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    Checked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoneCriteria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoneCriteria_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderBriefSections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    Goal = table.Column<string>(type: "text", nullable: false),
                    Audience = table.Column<string>(type: "text", nullable: false),
                    Screens = table.Column<string>(type: "text", nullable: false),
                    Features = table.Column<string>(type: "text", nullable: false),
                    Contetn = table.Column<string>(type: "text", nullable: false),
                    Design = table.Column<string>(type: "text", nullable: false),
                    Constraints = table.Column<string>(type: "text", nullable: false),
                    OpenQuestions = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderBriefSections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderBriefSections_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    Impact = table.Column<string>(type: "text", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Resolved = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScopeItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Bucket = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScopeItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScopeItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClarificationQuestions_OrderID",
                table: "ClarificationQuestions",
                column: "OrderID");

            migrationBuilder.CreateIndex(
                name: "IX_DoneCriteria_OrderId",
                table: "DoneCriteria",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderBriefSections_OrderId",
                table: "OrderBriefSections",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RiskItems_OrderId",
                table: "RiskItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ScopeItems_OrderId",
                table: "ScopeItems",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClarificationQuestions");

            migrationBuilder.DropTable(
                name: "DoneCriteria");

            migrationBuilder.DropTable(
                name: "OrderBriefSections");

            migrationBuilder.DropTable(
                name: "RiskItems");

            migrationBuilder.DropTable(
                name: "ScopeItems");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "EstimatedDays",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "AiGenerated",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ClientApproved",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "FreelancerApproved",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ReadinessScore",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "TechnicalSpecification",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "WorkflowStage",
                table: "Orders");
        }
    }
}
