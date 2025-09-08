using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCardPageLink_AndCreatedUtc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Cards",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Cards",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "ContentUrl",
                table: "Cards",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedUtc",
                table: "Cards",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<int>(
                name: "PageId",
                table: "Cards",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Cards",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedUtc", "PageId" },
                values: new object[] { new DateTime(2025, 9, 8, 13, 24, 39, 218, DateTimeKind.Utc).AddTicks(1630), null });

            migrationBuilder.UpdateData(
                table: "Cards",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedUtc", "PageId" },
                values: new object[] { new DateTime(2025, 9, 8, 13, 24, 39, 218, DateTimeKind.Utc).AddTicks(2435), null });

            migrationBuilder.UpdateData(
                table: "Cards",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedUtc", "PageId" },
                values: new object[] { new DateTime(2025, 9, 8, 13, 24, 39, 218, DateTimeKind.Utc).AddTicks(2437), null });

            migrationBuilder.CreateIndex(
                name: "IX_Cards_PageId",
                table: "Cards",
                column: "PageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cards_Pages_PageId",
                table: "Cards",
                column: "PageId",
                principalTable: "Pages",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cards_Pages_PageId",
                table: "Cards");

            migrationBuilder.DropIndex(
                name: "IX_Cards_PageId",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "CreatedUtc",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "PageId",
                table: "Cards");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Cards",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Cards",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(2048)",
                oldMaxLength: 2048,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ContentUrl",
                table: "Cards",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(2048)",
                oldMaxLength: 2048,
                oldNullable: true);
        }
    }
}
