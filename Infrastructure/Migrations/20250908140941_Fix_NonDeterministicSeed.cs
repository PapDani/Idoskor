using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Fix_NonDeterministicSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Cards",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Cards",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Cards",
                keyColumn: "Id",
                keyValue: 3);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Cards",
                columns: new[] { "Id", "ContentUrl", "CreatedUtc", "ImageUrl", "PageId", "Title" },
                values: new object[,]
                {
                    { 1, "/content/welcome", new DateTime(2025, 9, 8, 13, 31, 30, 508, DateTimeKind.Utc).AddTicks(3297), "/images/welcome.jpg", null, "Welcome" },
                    { 2, "/content/about", new DateTime(2025, 9, 8, 13, 31, 30, 508, DateTimeKind.Utc).AddTicks(4199), "/images/about.jpg", null, "About Us" },
                    { 3, "/content/contact", new DateTime(2025, 9, 8, 13, 31, 30, 508, DateTimeKind.Utc).AddTicks(4201), "/images/contact.jpg", null, "Contact" }
                });
        }
    }
}
