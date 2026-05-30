using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace backend;

public class GlobalExceptionHandler : IExceptionHandler
{
	public async ValueTask<bool> TryHandleAsync(
			HttpContext httpContext, 
			Exception exception, 
			CancellationToken cancellationToken)
	{
		int statusCode = exception switch 
		{
			OrderNotFoundException => StatusCodes.Status404NotFound,
			ProposalNotFoundException => StatusCodes.Status404NotFound,
			UserNotFoundException => StatusCodes.Status404NotFound,
			ProposalAlreadyExistsException => StatusCodes.Status409Conflict,
			ForbiddenProposalOperationException => StatusCodes.Status403Forbidden,
			FreelancerAlreadySelectedException => StatusCodes.Status409Conflict,
			FreelancerNotSelectedException => StatusCodes.Status409Conflict,
			OrderNotPublishedException => StatusCodes.Status409Conflict,
			EmptyContactsException => StatusCodes.Status400BadRequest,
			InvalidEmailException => StatusCodes.Status400BadRequest,
			EmailExsistsException => StatusCodes.Status400BadRequest,
			NullCompanyException => StatusCodes.Status400BadRequest,
			_ => StatusCodes.Status500InternalServerError
		};

		string title = exception switch
		{
			OrderNotFoundException => "Order not found",
			ProposalNotFoundException => "Proposal not found",
			UserNotFoundException => "User not found",
			ProposalAlreadyExistsException => "Proposal already exists",
			ForbiddenProposalOperationException => "Forbidden",
			FreelancerAlreadySelectedException => "Freelancer already selected",
			FreelancerNotSelectedException => "Freelancer not selected",
			OrderNotPublishedException => "Order not published",
			EmptyContactsException => "Empty Contacts",
			InvalidEmailException => "Invalid Email",
			EmailExsistsException => "Email already exists",
			NullCompanyException => "Null company",
			_ => "Internal server error"
		};

		ProblemDetails problemDetails = new()
		{
			Status = statusCode,
			Title = title,
			Detail = statusCode == StatusCodes.Status500InternalServerError
					? "Unexpected server error." 
					:  exception.Message,
			Instance = httpContext.Request.Path
		};

		if(exception is AppException appException)
		{
			problemDetails.Extensions["code"] = appException.Code;
		}

		httpContext.Response.StatusCode = statusCode;
		httpContext.Response.ContentType = "application/problem+json";

		await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

		return true;
	}
}
