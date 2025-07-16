using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Api.Filters
{
    /// <summary>
    /// Detects IFormFile parameters and changes the operation to consume multipart/form-data.
    /// </summary>
    public class SwaggerMultipartFormDataFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // find any FormFile parameters
            var formFileParams = context.MethodInfo
                .GetParameters()
                .Where(p => p.ParameterType == typeof(IFormFile)
                         || p.ParameterType == typeof(IFormFileCollection))
                .ToList();

            if (!formFileParams.Any())
                return;

            // mark consumes
            operation.RequestBody = new OpenApiRequestBody
            {
                Content =
                {
                    ["multipart/form-data"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = formFileParams
                                .ToDictionary(
                                    p => p.Name!,
                                    p => new OpenApiSchema
                                    {
                                        Type = "string",
                                        Format = "binary"
                                    })
                        }
                    }
                }
            };
        }
    }
}
