using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Moq;

namespace backend.Tests;

public class OrderControllerAuthorizationTest : IDisposable
{
	private const int OrderId = 10;
	private const int ProposalId = 11;
	private const int UserId = 42;

	private readonly TestApplicationFactory _factory = new();

	[Fact]
	public async Task CreateOrder_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendCreateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task CreateOrder_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendCreateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task CreateOrder_WhenUserRoleIsNotClient_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendCreateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task CreateOrder_WhenAuthenticatedClientHasInvalidUserId_ReturnsUnauthorized()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, "abc");

		HttpResponseMessage response = await SendCreateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task CreateOrder_WhenUserRoleIsClient_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, UserId);

		_factory.OrderServiceMock
			.Setup(x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				UserId,
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendCreateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				UserId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task UpdateOrder_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendUpdateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateOrder_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendUpdateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task UpdateOrder_WhenUserRoleIsNotClient_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendUpdateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateOrder_WhenAuthenticatedClientHasInvalidUserId_ReturnsUnauthorized()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, "abc");

		HttpResponseMessage response = await SendUpdateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateOrder_WhenUserRoleIsClient_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, UserId);
		UpdateOrderRequest request = BuildUpdateOrderRequest();

		_factory.OrderServiceMock
			.Setup(x => x.UpdateOrderAsync(
				OrderId,
				UserId,
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendUpdateOrderAsync(client, request);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateOrderAsync(
				OrderId,
				UserId,
				It.Is<UpdateOrderRequest>(r => r.Title == request.Title),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task UpdateClarificationQuestions_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendUpdateClarificationQuestionsAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClarificationQuestionsAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateClarificationQuestionsRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClarificationQuestions_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendUpdateClarificationQuestionsAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClarificationQuestionsAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateClarificationQuestionsRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptFreelancer))]
	public async Task UpdateClarificationQuestions_WhenUserIsNotFreelancer_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendUpdateClarificationQuestionsAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClarificationQuestionsAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateClarificationQuestionsRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClarificationQuestions_WhenUserRoleIsFreelancer_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Freelancer, UserId);
		UpdateClarificationQuestionsRequest request = BuildUpdateClarificationQuestionsRequest();

		_factory.OrderServiceMock
			.Setup(x => x.UpdateClarificationQuestionsAsync(
				OrderId,
				UserId,
				It.IsAny<UpdateClarificationQuestionsRequest>(),
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendUpdateClarificationQuestionsAsync(client, request);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClarificationQuestionsAsync(
				OrderId,
				UserId,
				It.Is<UpdateClarificationQuestionsRequest>(r =>
					r.ClarificationQuestions.Count == request.ClarificationQuestions.Count),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task RespondToOrder_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendRespondToOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.RespondToOrderAsync(
				It.IsAny<int>(),
				It.IsAny<CreateProposalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task RespondToOrder_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendRespondToOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.RespondToOrderAsync(
				It.IsAny<int>(),
				It.IsAny<CreateProposalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptFreelancer))]
	public async Task RespondToOrder_WhenUserIsNotFreelancer_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendRespondToOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.RespondToOrderAsync(
				It.IsAny<int>(),
				It.IsAny<CreateProposalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task RespondToOrder_WhenUserRoleIsFreelancer_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Freelancer, UserId);
		CreateProposalRequest request = BuildCreateProposalRequest();

		_factory.OrderServiceMock
			.Setup(x => x.RespondToOrderAsync(
				UserId,
				It.IsAny<CreateProposalRequest>(),
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendRespondToOrderAsync(client, request);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.RespondToOrderAsync(
				UserId,
				It.Is<CreateProposalRequest>(r => r.OrderId == request.OrderId),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task AcceptProposal_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendAcceptProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task AcceptProposal_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendAcceptProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task AcceptProposal_WhenUserRoleIsNotClient_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendAcceptProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task AcceptProposal_WhenUserRoleIsClient_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, UserId);

		_factory.OrderServiceMock
			.Setup(x => x.AcceptProposalAsync(
				ProposalId,
				UserId,
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendAcceptProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptProposalAsync(
				ProposalId,
				UserId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task WithdrawProposal_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendWithdrawProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.WithdrawProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task WithdrawProposal_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendWithdrawProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.WithdrawProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptFreelancer))]
	public async Task WithdrawProposal_WhenUserIsNotFreelancer_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendWithdrawProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.WithdrawProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task WithdrawProposal_WhenUserRoleIsFreelancer_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Freelancer, UserId);

		_factory.OrderServiceMock
			.Setup(x => x.WithdrawProposalAsync(
				ProposalId,
				UserId,
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendWithdrawProposalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.WithdrawProposalAsync(
				ProposalId,
				UserId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task UpdateClientApproval_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendUpdateClientApprovalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClientApproval(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClientApproval_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendUpdateClientApprovalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClientApproval(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task UpdateClientApproval_WhenUserRoleIsNotClient_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendUpdateClientApprovalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClientApproval(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClientApproval_WhenUserRoleIsClient_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, UserId);
		UpdateApprovalRequest request = BuildUpdateApprovalRequest();

		_factory.OrderServiceMock
			.Setup(x => x.UpdateClientApproval(
				OrderId,
				UserId,
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendUpdateClientApprovalAsync(client, request);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateClientApproval(
				OrderId,
				UserId,
				It.Is<UpdateApprovalRequest>(r => r.Approved == request.Approved),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task UpdateFreelancerCompletion_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendUpdateFreelancerCompletionAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.CompleteByFreelancer(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateFreelancerCompletion_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendUpdateFreelancerCompletionAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.CompleteByFreelancer(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptFreelancer))]
	public async Task UpdateFreelancerCompletion_WhenUserIsNotFreelancer_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendUpdateFreelancerCompletionAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.CompleteByFreelancer(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateFreelancerCompletion_WhenUserRoleIsFreelancer_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Freelancer, UserId);

		_factory.OrderServiceMock
			.Setup(x => x.CompleteByFreelancer(
				OrderId,
				UserId,
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendUpdateFreelancerCompletionAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.CompleteByFreelancer(
				OrderId,
				UserId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task UpdateClientCompletionAccept_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendUpdateClientCompletionAcceptAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClientCompletionAccept_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendUpdateClientCompletionAcceptAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task UpdateClientCompletionAccept_WhenUserRoleIsNotClient_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendUpdateClientCompletionAcceptAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClientCompletionAccept_WhenUserRoleIsClient_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, UserId);

		_factory.OrderServiceMock
			.Setup(x => x.AcceptCompletionByClient(
				OrderId,
				UserId,
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendUpdateClientCompletionAcceptAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.AcceptCompletionByClient(
				OrderId,
				UserId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task UpdateClientCompletionReject_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendUpdateClientCompletionRejectAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.RejectCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClientCompletionReject_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendUpdateClientCompletionRejectAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.RejectCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task UpdateClientCompletionReject_WhenUserRoleIsNotClient_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendUpdateClientCompletionRejectAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.RejectCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateClientCompletionReject_WhenUserRoleIsClient_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, UserId);

		_factory.OrderServiceMock
			.Setup(x => x.RejectCompletionByClient(
				OrderId,
				UserId,
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendUpdateClientCompletionRejectAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.RejectCompletionByClient(
				OrderId,
				UserId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task UpdateFreelancerApproval_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendUpdateFreelancerApprovalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateFreelancerApprovalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateFreelancerApproval_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await SendUpdateFreelancerApprovalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateFreelancerApprovalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptFreelancer))]
	public async Task UpdateFreelancerApproval_WhenUserIsNotFreelancer_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await SendUpdateFreelancerApprovalAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateFreelancerApprovalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task UpdateFreelancerApproval_WhenUserRoleIsFreelancer_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClient(Role.Freelancer, UserId);
		UpdateApprovalRequest request = BuildUpdateApprovalRequest();

		_factory.OrderServiceMock
			.Setup(x => x.UpdateFreelancerApprovalAsync(
				OrderId,
				UserId,
				It.IsAny<UpdateApprovalRequest>(),
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendUpdateFreelancerApprovalAsync(client, request);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.UpdateFreelancerApprovalAsync(
				OrderId,
				UserId,
				It.Is<UpdateApprovalRequest>(r => r.Approved == request.Approved),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task RateOrder_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await SendRateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.RateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRatingRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task RateOrder_WhenUserIsAuthenticatedWithoutRole_ReturnsOk()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole(UserId);
		UpdateOrderRatingRequest request = BuildUpdateOrderRatingRequest();

		_factory.OrderServiceMock
			.Setup(x => x.RateOrderAsync(
				OrderId,
				UserId,
				It.Is<UpdateOrderRatingRequest>(r => r.Score == request.Score),
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendRateOrderAsync(client, request);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.RateOrderAsync(
				OrderId,
				UserId,
				It.IsAny<UpdateOrderRatingRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Theory]
	[MemberData(nameof(AllRoles))]
	public async Task RateOrder_WhenUserHasAnyRole_ReturnsOk(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role, UserId);
		UpdateOrderRatingRequest request = BuildUpdateOrderRatingRequest();

		_factory.OrderServiceMock
			.Setup(x => x.RateOrderAsync(
				OrderId,
				UserId,
				It.Is<UpdateOrderRatingRequest>(r => r.Score == request.Score),
				It.IsAny<CancellationToken>()
			))
			.ReturnsAsync(BuildOrderStub(UserId));

		HttpResponseMessage response = await SendRateOrderAsync(client, request);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.OrderServiceMock.Verify(
			x => x.RateOrderAsync(
				OrderId,
				UserId,
				It.IsAny<UpdateOrderRatingRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task RateOrder_WhenAuthenticatedUserHasInvalidUserId_ReturnsUnauthorized()
	{
		HttpClient client = CreateAuthorizedClient(Role.Client, "abc");

		HttpResponseMessage response = await SendRateOrderAsync(client);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.OrderServiceMock.Verify(
			x => x.RateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRatingRequest>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	public static IEnumerable<object[]> RolesExceptClient()
	{
		return Enum
			.GetValues<Role>()
			.Where(role => role != Role.Client)
			.Select(role => new object[] { role });
	}

	public static IEnumerable<object[]> RolesExceptFreelancer()
	{
		return Enum
			.GetValues<Role>()
			.Where(role => role != Role.Freelancer)
			.Select(role => new object[] { role });
	}

	public static IEnumerable<object[]> AllRoles()
	{
		return Enum
			.GetValues<Role>()
			.Select(role => new object[] { role });
	}

	private HttpClient CreateAuthorizedClient(Role role, int userId = UserId)
	{
		return CreateAuthorizedClient(role, userId.ToString());
	}

	private HttpClient CreateAuthorizedClient(Role role, string userId)
	{
		HttpClient client = CreateAuthorizedClientWithoutRole(userId);

		client.DefaultRequestHeaders.Add(
			TestAuthHandler.RoleHeader,
			role.ToString()
		);

		return client;
	}

	private HttpClient CreateAuthorizedClientWithoutRole(int userId = UserId)
	{
		return CreateAuthorizedClientWithoutRole(userId.ToString());
	}

	private HttpClient CreateAuthorizedClientWithoutRole(string userId)
	{
		HttpClient client = _factory.CreateClient();

		client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue(TestAuthHandler.SchemeName);

		client.DefaultRequestHeaders.Add(
			TestAuthHandler.UserIdHeader,
			userId
		);

		return client;
	}

	private static Task<HttpResponseMessage> SendCreateOrderAsync(
		HttpClient client,
		CreateOrderRequest? request = null)
	{
		return client.PostAsync(
			"/api/v1/order/create",
			CreateJsonContent(request ?? BuildCreateOrderRequest())
		);
	}

	private static Task<HttpResponseMessage> SendUpdateOrderAsync(
		HttpClient client,
		UpdateOrderRequest? request = null)
	{
		return client.PutAsync(
			$"/api/v1/order/update/{OrderId}",
			CreateJsonContent(request ?? BuildUpdateOrderRequest())
		);
	}

	private static Task<HttpResponseMessage> SendUpdateClarificationQuestionsAsync(
		HttpClient client,
		UpdateClarificationQuestionsRequest? request = null)
	{
		return client.PutAsync(
			$"/api/v1/order/{OrderId}/clarification-questions",
			CreateJsonContent(request ?? BuildUpdateClarificationQuestionsRequest())
		);
	}

	private static Task<HttpResponseMessage> SendRespondToOrderAsync(
		HttpClient client,
		CreateProposalRequest? request = null)
	{
		return client.PutAsJsonAsync(
			"/api/v1/order/proposal/create",
			request ?? BuildCreateProposalRequest()
		);
	}

	private static Task<HttpResponseMessage> SendAcceptProposalAsync(HttpClient client)
	{
		return client.PutAsync(
			$"/api/v1/order/proposal/{ProposalId}/accept",
			content: null
		);
	}

	private static Task<HttpResponseMessage> SendWithdrawProposalAsync(HttpClient client)
	{
		return client.PutAsync(
			$"/api/v1/order/proposal/{ProposalId}/withdraw",
			content: null
		);
	}

	private static Task<HttpResponseMessage> SendUpdateClientApprovalAsync(
		HttpClient client,
		UpdateApprovalRequest? request = null)
	{
		return client.PutAsJsonAsync(
			$"/api/v1/order/{OrderId}/approval/client",
			request ?? BuildUpdateApprovalRequest()
		);
	}

	private static Task<HttpResponseMessage> SendUpdateFreelancerCompletionAsync(HttpClient client)
	{
		return client.PutAsync(
			$"/api/v1/order/{OrderId}/completion/freelancer",
			content: null
		);
	}

	private static Task<HttpResponseMessage> SendUpdateClientCompletionAcceptAsync(HttpClient client)
	{
		return client.PutAsync(
			$"/api/v1/order/{OrderId}/completion/client/accept",
			content: null
		);
	}

	private static Task<HttpResponseMessage> SendUpdateClientCompletionRejectAsync(HttpClient client)
	{
		return client.PutAsync(
			$"/api/v1/order/{OrderId}/completion/client/reject",
			content: null
		);
	}

	private static Task<HttpResponseMessage> SendUpdateFreelancerApprovalAsync(
		HttpClient client,
		UpdateApprovalRequest? request = null)
	{
		return client.PutAsJsonAsync(
			$"/api/v1/order/{OrderId}/approval/freelancer",
			request ?? BuildUpdateApprovalRequest()
		);
	}

	private static Task<HttpResponseMessage> SendRateOrderAsync(
		HttpClient client,
		UpdateOrderRatingRequest? request = null)
	{
		return client.PutAsJsonAsync(
			$"/api/v1/order/{OrderId}/rating",
			request ?? BuildUpdateOrderRatingRequest()
		);
	}

	private static CreateOrderRequest BuildCreateOrderRequest()
	{
		return new CreateOrderRequest
		{
			Title = "Landing page",
			RawDescription = "Need landing page",
			Category = Category.Development,
			BudgetMin = 1000,
			BudgetMax = 2000,
			Currency = Currency.USD,
			BudgetType = Payment.Fixed
		};
	}

	private static UpdateOrderRequest BuildUpdateOrderRequest()
	{
		return new UpdateOrderRequest
		{
			Title = "Updated landing page",
			RawDescription = "Updated project description",
			TechnicalSpecification = "ASP.NET Core + React",
			Category = Category.Development,
			BudgetMin = 1500,
			BudgetMax = 2500,
			Currency = Currency.USD,
			BudgetType = Payment.Fixed,
			Skills = ["C#", "React"],
			Status = OrderStatus.Published,
			WorkflowStage = WorkflowStage.review,
			AiGenerated = false,
			ReadinessScore = 87,
			CompanyName = "Acme"
		};
	}

	private static UpdateClarificationQuestionsRequest BuildUpdateClarificationQuestionsRequest()
	{
		return new UpdateClarificationQuestionsRequest
		{
			ClarificationQuestions =
			[
				new ClarificationQuestionRequest
				{
					id = 1,
					Question = "Do you need admin panel?",
					Importance = RiskLevel.medium,
					Answer = "No answer yet",
					Options = ["Yes", "No"]
				}
			]
		};
	}

	private static CreateProposalRequest BuildCreateProposalRequest()
	{
		return new CreateProposalRequest
		{
			OrderId = OrderId,
			Price = 1800,
			EstimatedDays = 14,
			Message = "I can deliver the project with milestones and weekly demos."
		};
	}

	private static UpdateApprovalRequest BuildUpdateApprovalRequest()
	{
		return new UpdateApprovalRequest
		{
			Approved = true
		};
	}

	private static UpdateOrderRatingRequest BuildUpdateOrderRatingRequest()
	{
		return new UpdateOrderRatingRequest
		{
			Score = 5
		};
	}

	private static Order BuildOrderStub(int userId)
	{
		return new Order
		{
			Id = OrderId,
			CustomerId = userId,
			Customer = new User
			{
				Id = userId,
				FullName = "Test User"
			},
			Title = "Test order"
		};
	}

	private static JsonContent CreateJsonContent<T>(T value)
	{
		JsonSerializerOptions options = new();
		options.Converters.Add(new JsonStringEnumConverter());

		return JsonContent.Create(value, options: options);
	}

	public void Dispose()
	{
		_factory.Dispose();
	}
}
