using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ChangeContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClarificationQuestions_Orders_OrderID",
                table: "ClarificationQuestions");

            migrationBuilder.DropForeignKey(
                name: "FK_RiskItems_Orders_OrderId",
                table: "RiskItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RiskItems",
                table: "RiskItems");

            migrationBuilder.RenameTable(
                name: "RiskItems",
                newName: "Risks");

            migrationBuilder.RenameColumn(
                name: "Contetn",
                table: "OrderBriefSections",
                newName: "Content");

            migrationBuilder.RenameColumn(
                name: "OrderID",
                table: "ClarificationQuestions",
                newName: "OrderId");

            migrationBuilder.RenameColumn(
                name: "RiskLevel",
                table: "ClarificationQuestions",
                newName: "Importance");

            migrationBuilder.RenameIndex(
                name: "IX_ClarificationQuestions_OrderID",
                table: "ClarificationQuestions",
                newName: "IX_ClarificationQuestions_OrderId");

            migrationBuilder.RenameIndex(
                name: "IX_RiskItems_OrderId",
                table: "Risks",
                newName: "IX_Risks_OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Risks",
                table: "Risks",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClarificationQuestions_Orders_OrderId",
                table: "ClarificationQuestions",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Risks_Orders_OrderId",
                table: "Risks",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClarificationQuestions_Orders_OrderId",
                table: "ClarificationQuestions");

            migrationBuilder.DropForeignKey(
                name: "FK_Risks_Orders_OrderId",
                table: "Risks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Risks",
                table: "Risks");

            migrationBuilder.RenameTable(
                name: "Risks",
                newName: "RiskItems");

            migrationBuilder.RenameColumn(
                name: "Content",
                table: "OrderBriefSections",
                newName: "Contetn");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "ClarificationQuestions",
                newName: "OrderID");

            migrationBuilder.RenameColumn(
                name: "Importance",
                table: "ClarificationQuestions",
                newName: "RiskLevel");

            migrationBuilder.RenameIndex(
                name: "IX_ClarificationQuestions_OrderId",
                table: "ClarificationQuestions",
                newName: "IX_ClarificationQuestions_OrderID");

            migrationBuilder.RenameIndex(
                name: "IX_Risks_OrderId",
                table: "RiskItems",
                newName: "IX_RiskItems_OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RiskItems",
                table: "RiskItems",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClarificationQuestions_Orders_OrderID",
                table: "ClarificationQuestions",
                column: "OrderID",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RiskItems_Orders_OrderId",
                table: "RiskItems",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
