using System.Security.Claims;
using System.Security.Cryptography;
using backend.Migrations;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using MyApp.Namespace;
using Org.BouncyCastle.Crypto.Engines;
using Telegram.Bot.Types;

namespace backend.Tests;

public class OrderControllerTest
{
	private readonly Mock<IOrderService> _orderService = new(MockBehavior.Strict);

	[Fact]
	public async Task GetById_WhenOrderExists_ReturnsOkWithOrderDto()
	{
		OrderController controller = CreateController(userId: 1, role: nameof(Role.Client));
		Order order = CreateOrder();

		_orderService
			.Setup(x => x.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
			.ReturnsAsync(order);

		IActionResult result = await controller.GetById(order.Id, CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(CreateExpectedOrderDto(order));

		_orderService.Verify(
			x => x.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task GetOrders_WhenOrdersExists_ReturnsOkWithOrderDto()
	{
		OrderController controller = CreateController(1, nameof(Role.Client));
		Order order = CreateOrder();
		List<OrderListItemDto> expectedOrderDtos = new();
		expectedOrderDtos.Add(CreateExpectedOrderDto(order));
		_orderService
			.Setup(x => x.GetListAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedOrderDtos);
		
		IActionResult result = await controller.GetOrders(CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(expectedOrderDtos);

		_orderService.Verify(
			x => x.GetListAsync(It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task GetAcceptedProjectList_WhenAcceptedOrders_ReturnOkWithOrderDto()
	{
		OrderController controller = CreateController(1, nameof(Role.Client));
		Order order = CreateOrder();
		List<OrderListItemDto> dtos = new();
		dtos.Add(CreateExpectedOrderDto(order));

		_orderService
			.Setup(x => x.GetAccteptedProjectListAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(dtos);

		IActionResult result = await controller.GetAccteptedProjectList(CancellationToken.None);
		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(dtos);

		_orderService.Verify(
			x => x.GetAccteptedProjectListAsync(It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task CreateOrder_WhenClientCreatesOrder_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		CreateOrderRequest request = CreateOrderRequest();
		Order createdOrder = CreateOrder();
		OrderListItemDto  expectedDto = CreateExpectedOrderDto(createdOrder);
		
		_orderService
			.Setup(x => x.CreateOrderAsync(request, userId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller.CreateOrder(request, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.CreateOrderAsync(request, userId, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task CreateOrder_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));

		CreateOrderRequest request = CreateCreateOrderRequest();

		IActionResult result = await controller.CreateOrder(request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task CreateOrder_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		CreateOrderRequest request = CreateOrderRequest();

		IActionResult result = await controller.CreateOrder(request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.CreateOrderAsync(
				It.IsAny<CreateOrderRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateOrder_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		UpdateOrderRequest request = CreateUpdateOrderRequest();

		IActionResult result = await controller.UpdateOrder(1, request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateOrderAsync(
				1,
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateOrder_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));

		UpdateOrderRequest request = CreateUpdateOrderRequest();

		IActionResult result = await controller.UpdateOrder(1, request, CancellationToken.None);
		
		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateOrderAsync(
				1,
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateOrder_WhenRequestBudgetMinLowerThenZero_RetrunsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		UpdateOrderRequest request = CreateUpdateOrderRequest();
		Order updatedOrder = CreateOrder();
		request.BudgetMin = -1;

		IActionResult result = await controller.UpdateOrder(updatedOrder.Id, request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new 
		{
			message = "Некорректные значения цен."
		});

		_orderService.Verify(
			x => x.UpdateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateOrder_WhenRequestBudgetMaxLowerThenZero_RetrunsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		UpdateOrderRequest request = CreateUpdateOrderRequest();
		Order updatedOrder = CreateOrder();
		request.BudgetMax = -1;

		IActionResult result = await controller.UpdateOrder(updatedOrder.Id, request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new 
		{
			message = "Некорректные значения цен."
		});

		_orderService.Verify(
			x => x.UpdateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateOrder_WhenRequestBudgetMaxIsLowerBudgetMin_RetrunsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		UpdateOrderRequest request = CreateUpdateOrderRequest();
		Order updatedOrder = CreateOrder();
		request.BudgetMax = 100;
		request.BudgetMin = 200;

		IActionResult result = await controller.UpdateOrder(updatedOrder.Id, request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new 
		{
			message = "Некорректные значения цен."
		});

		_orderService.Verify(
			x => x.UpdateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<UpdateOrderRequest>(),
				It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateOrder_WhenClientUpdateOrder_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		UpdateOrderRequest request = CreateUpdateOrderRequest();
		Order updatedOrder = CreateOrder();

		_orderService
			.Setup(x => x.UpdateOrderAsync(updatedOrder.Id, userId, request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(updatedOrder);

		IActionResult result = await controller.UpdateOrder(updatedOrder.Id, request, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;
		OrderListItemDto dto = CreateExpectedOrderDto(updatedOrder);
		ok.Value.Should().BeEquivalentTo(dto);


		_orderService.Verify(
			x => x.UpdateOrderAsync(updatedOrder.Id, userId, request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task UpdateClarificationQuestions_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Freelancer));

		UpdateClarificationQuestionsRequest request = CreateUpdateClarificationQuestionsRequest();

		IActionResult result = await controller.UpdateClarificationQuestions(It.IsAny<int>(), request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateClarificationQuestionsAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClarificationQuestions_WhenUserIdClaimsIsInvalid_ReturnUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Freelancer));

		UpdateClarificationQuestionsRequest request = CreateUpdateClarificationQuestionsRequest();

		IActionResult result = await controller.UpdateClarificationQuestions(It.IsAny<int>(), request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateClarificationQuestionsAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClarificationQuestions_WhenUserIdClaimsIsValid_ReturnOkOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Freelancer));

		UpdateClarificationQuestionsRequest request = CreateUpdateClarificationQuestionsRequest();

		Order order = CreateOrder();
		OrderListItemDto expectedDto = CreateExpectedOrderDto(order);

		_orderService
			.Setup(x => x.UpdateClarificationQuestionsAsync(order.Id, userId, request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(order);

		IActionResult result = await controller.UpdateClarificationQuestions(order.Id, request, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.UpdateClarificationQuestionsAsync(
				order.Id,
				userId,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Freelancer));

		CreateProposalRequest request = CreateProposalRequest();

		IActionResult result = await controller.RespondToOrder(request, It.IsAny<CancellationToken>());

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.RespondToOrderAsync(
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenUserIdIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Freelancer));

		CreateProposalRequest request = CreateProposalRequest();

		IActionResult result = await controller.RespondToOrder(request, It.IsAny<CancellationToken>());

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.RespondToOrderAsync(
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenUserIdIsValid_ReturnsOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(1, nameof(Role.Freelancer));
		CreateProposalRequest request = CreateProposalRequest();

		Order createOrder = CreateOrder();
		OrderListItemDto expectedDto = CreateExpectedOrderDto(createOrder);

		_orderService
			.Setup(x => x.RespondToOrderAsync(1, request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createOrder);

		IActionResult result = await controller.RespondToOrder(request, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.RespondToOrderAsync(
				1,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenRequestPriceLowerOrEqualZero_ReturnsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Freelancer));

		CreateProposalRequest request = CreateProposalRequest();
		Order proposalOrder = CreateOrder();
		request.Price = 0;

		IActionResult result = await controller.RespondToOrder(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Заполните сообщение, стоимость и срок отклика."	
		});

		_orderService.Verify(
			x => x.RespondToOrderAsync(userId, request, It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenRequestEstimatedDaysLowerOrEqualZero_ReturnsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Freelancer));

		CreateProposalRequest request = CreateProposalRequest();
		Order proposalOrder = CreateOrder();
		request.EstimatedDays = 0;

		IActionResult result = await controller.RespondToOrder(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Заполните сообщение, стоимость и срок отклика."	
		});

		_orderService.Verify(
			x => x.RespondToOrderAsync(userId, request, It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenRequestMessageIsNullOrWhiteSpace_ReturnsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Freelancer));

		CreateProposalRequest request = CreateProposalRequest();
		Order proposalOrder = CreateOrder();
		request.Message = "";

		IActionResult result = await controller.RespondToOrder(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Заполните сообщение, стоимость и срок отклика."	
		});

		_orderService.Verify(
			x => x.RespondToOrderAsync(userId, request, It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenRequestMessageTrimLengthLower20_ReturnsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Freelancer));

		CreateProposalRequest request = CreateProposalRequest();
		Order proposalOrder = CreateOrder();
		request.Message = "Abc";

		IActionResult result = await controller.RespondToOrder(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Заполните сообщение, стоимость и срок отклика."	
		});

		_orderService.Verify(
			x => x.RespondToOrderAsync(userId, request, It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task RespondToOrder_WhenRequestOrderIdLowerOrEqualZero_ReturnsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Freelancer));

		CreateProposalRequest request = CreateProposalRequest();
		Order proposalOrder = CreateOrder();
		request.OrderId = 0;

		IActionResult result = await controller.RespondToOrder(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Заполните сообщение, стоимость и срок отклика."	
		});

		_orderService.Verify(
			x => x.RespondToOrderAsync(userId, request, It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task AcceptProposal_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));

		CreateProposalRequest request = CreateProposalRequest();

		IActionResult result = await controller.AcceptProposal(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.AcceptProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task AcceptProposal_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		CreateProposalRequest request = CreateProposalRequest();

		IActionResult result = await controller.AcceptProposal(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.AcceptProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task AcceptedProposal_WhenUserIdClaimsIsValid_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		CreateProposalRequest request = CreateProposalRequest();
		Order createdOrder = CreateOrder();
		OrderListItemDto expectedDto = CreateExpectedOrderDto(createdOrder);

		_orderService
			.Setup(x => x.AcceptProposalAsync(1, userId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller.AcceptProposal(1, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.AcceptProposalAsync(
				1,
				userId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task WithdrawProposal_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));

		IActionResult result = await controller.WithdrawProposal(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.WithdrawProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task WithdrawProposal_WhenUserIdClaimIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		IActionResult result = await controller.WithdrawProposal(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.WithdrawProposalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task WithdrawProposal_WhenUserIdClaimIsValid_ReturnsOkWithOrderDto()
	{
		OrderController controller = CreateController(1, nameof(Role.Client));
		Order order = CreateOrder();
		OrderListItemDto dto = CreateExpectedOrderDto(order);

		_orderService
			.Setup(x => x.WithdrawProposalAsync(1, 1, It.IsAny<CancellationToken>()))
			.ReturnsAsync(order);

		IActionResult result = await controller.WithdrawProposal(1, CancellationToken.None);
		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(dto);

		_orderService.Verify(
			x => x.WithdrawProposalAsync(
				1,
				1,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task UpdateClientApproval_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));

		UpdateApprovalRequest request = CreateUpdateApprovalRequest();

		IActionResult result = await controller.UpdateClientApproval(It.IsAny<int>(), request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateClientApproval(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClientApproval_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		UpdateApprovalRequest request = CreateUpdateApprovalRequest();

		IActionResult result = await controller.UpdateClientApproval(It.IsAny<int>(), request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateClientApproval(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClientApproval_WhenUserIdClaimsIsValid_ReturnsOkWithOrderDto()
	{
		OrderController controller = CreateController(1, nameof(Role.Client));

		UpdateApprovalRequest request = CreateUpdateApprovalRequest();
		Order createdOrder = CreateOrder();
		OrderListItemDto  expectedDto = CreateExpectedOrderDto(createdOrder);
		
		_orderService
			.Setup(x => x.UpdateClientApproval(createdOrder.Id, 1, request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller.UpdateClientApproval(createdOrder.Id, request, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.UpdateClientApproval(
				createdOrder.Id,
				1,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task UpdateFreelacnerComplition_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));


		IActionResult result = await controller.UpdateFreelacnerComplition(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.CompleteByFreelancer(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateFreelacnerComplition_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		IActionResult result = await controller.UpdateFreelacnerComplition(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.CompleteByFreelancer(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateFreelacnerComplition_WhenUserIdClaimsIsValid_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		Order createdOrder = CreateOrder();
		OrderListItemDto  expectedDto = CreateExpectedOrderDto(createdOrder);
		
		_orderService
			.Setup(x => x.CompleteByFreelancer(createdOrder.Id, userId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller.UpdateFreelacnerComplition(createdOrder.Id, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.CompleteByFreelancer(createdOrder.Id, userId, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task UpdateUpdateClientComplitionAccept_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));


		IActionResult result = await controller.UpdateClientComplitionAccept(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.AcceptCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClientComplitionAccept_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		IActionResult result = await controller.UpdateClientComplitionAccept(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.AcceptCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClientComplitionAccept_WhenUserIdClaimsIsValid_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		Order createdOrder = CreateOrder();
		OrderListItemDto  expectedDto = CreateExpectedOrderDto(createdOrder);
		
		_orderService
			.Setup(x => x.AcceptCompletionByClient(createdOrder.Id, userId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller.UpdateClientComplitionAccept(createdOrder.Id, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.AcceptCompletionByClient(createdOrder.Id, userId, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task UpdateClientComplitionReject_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));

		IActionResult result = await controller.UpdateClientComplitionReject(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.RejectCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClientComplitionReject_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));

		IActionResult result = await controller.UpdateClientComplitionReject(It.IsAny<int>(), CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.RejectCompletionByClient(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateClientComplitionReject_WhenUserIdClaimsIsValid_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));

		Order createdOrder = CreateOrder();
		OrderListItemDto  expectedDto = CreateExpectedOrderDto(createdOrder);
		
		_orderService
			.Setup(x => x.RejectCompletionByClient(createdOrder.Id, userId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller.UpdateClientComplitionReject(createdOrder.Id, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.RejectCompletionByClient(createdOrder.Id, userId, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task UpdateFreelancerApproval_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));
		UpdateApprovalRequest request = CreateUpdateApprovalRequest();
		IActionResult result = await controller
			.UpdateFreelancerApproval(It.IsAny<int>(),request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateFreelancerApprovalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateFreelancerApproval_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));
		UpdateApprovalRequest request = CreateUpdateApprovalRequest();
		IActionResult result = await controller
			.UpdateFreelancerApproval(It.IsAny<int>(),request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.UpdateFreelancerApprovalAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateFreelancerApproval_WhenUserIdClaimsIsValid_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));
		UpdateApprovalRequest request = CreateUpdateApprovalRequest();
		Order createdOrder = CreateOrder();
		OrderListItemDto  expectedDto = CreateExpectedOrderDto(createdOrder);
		
		_orderService
			.Setup(x => x.UpdateFreelancerApprovalAsync(createdOrder.Id, userId, request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller
			.UpdateFreelancerApproval(createdOrder.Id,request, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.UpdateFreelancerApprovalAsync(createdOrder.Id, userId,request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task RateOrder_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithoutUserId(nameof(Role.Client));
		UpdateOrderRatingRequest request = CreateUpdateOrderRatingRequest();
		IActionResult result = await controller
			.RateOrder(It.IsAny<int>(),request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.RateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task RateOrder_WhenUserIdClaimsIsInvalid_ReturnsUnauthorized()
	{
		OrderController controller = CreateControllerWithUserIdClaim("abc", nameof(Role.Client));
		UpdateOrderRatingRequest request = CreateUpdateOrderRatingRequest();
		IActionResult result = await controller
			.RateOrder(It.IsAny<int>(),request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_orderService.Verify(
			x => x.RateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task RateOrder_WhenUserIdClaimsIsValid_ReturnsOkWithOrderDto()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));
		UpdateOrderRatingRequest request = CreateUpdateOrderRatingRequest();
		Order createdOrder = CreateOrder();
		OrderListItemDto  expectedDto = CreateExpectedOrderDto(createdOrder);
		
		_orderService
			.Setup(x => x.RateOrderAsync(createdOrder.Id, userId, request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdOrder);

		IActionResult result = await controller
			.RateOrder(createdOrder.Id,request, CancellationToken.None);

		OkObjectResult ok = result.Should()
			.BeOfType<OkObjectResult>()
			.Subject;

		ok.Value.Should().BeEquivalentTo(expectedDto);

		_orderService.Verify(
			x => x.RateOrderAsync(createdOrder.Id, userId,request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task RateOrder_WhenRequestScoreLowerThenOne_ReturnsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));
		UpdateOrderRatingRequest request = CreateUpdateOrderRatingRequest();
		Order createdOrder = CreateOrder();
		request.Score = 0;

		IActionResult result = await controller
			.RateOrder(createdOrder.Id,request, CancellationToken.None);
	
		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Оценка должна быть от 1 до 5."
		});

		_orderService.Verify(
			x => x.RateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task RateOrder_WhenRequestScoreBiggerThenFive_ReturnsBadRequest()
	{
		const int userId = 1;

		OrderController controller = CreateController(userId, nameof(Role.Client));
		UpdateOrderRatingRequest request = CreateUpdateOrderRatingRequest();
		Order createdOrder = CreateOrder();
		request.Score = 6;

		IActionResult result = await controller
			.RateOrder(createdOrder.Id,request, CancellationToken.None);
	
		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Оценка должна быть от 1 до 5."
		});

		_orderService.Verify(
			x => x.RateOrderAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	private static CreateOrderRequest CreateCreateOrderRequest()
	{
		return new CreateOrderRequest
		{
			Title = "Test order",
			RawDescription = "Test description",
			TechnicalSpecification = "Test specification",
			Category = Category.Development,
			BudgetMin = 1000,
			BudgetMax = 1500,
			Currency = Currency.USD,
			BudgetType = Payment.Hourly,
			Skills = ["C#", "ASP.NET"],
			AiGenerated = false,
			ReadinessScore = 100,
		};
	}
	private OrderController CreateControllerWithUserIdClaim(string userIdValue, string role)
	{
		var controller = new OrderController(_orderService.Object);

		var claims = new List<Claim>
		{
			new(ClaimTypes.NameIdentifier, userIdValue),
			new(ClaimTypes.Role, role)
		};

		var identity = new ClaimsIdentity(claims, "TestAuth");
		var user = new ClaimsPrincipal(identity);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = user
			}
		};

		return controller;
	}
	private OrderController CreateControllerWithoutUserId(string role)
	{
		var controller = new OrderController(_orderService.Object);

		var claims = new List<Claim>
		{
			new(ClaimTypes.Role, role)
		};

		var identity = new ClaimsIdentity(claims, "TestAuth");
		var user = new ClaimsPrincipal(identity);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = user
			}
		};

		return controller;
	}
	private OrderController CreateController(int? userId = null, string? role = null)
	{
		List<Claim> claims = new();

		if (userId is not null)
		{
			claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
		}

		if (!string.IsNullOrWhiteSpace(role))
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
		}

		var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
		var controller = new OrderController(_orderService.Object);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = user
			}
		};

		return controller;
	}

	private static Order CreateOrder(
		int id = 1,
		int customerId = 1,
		int freelancerId = 2)
	{
		User customer = CreateClientUser(customerId);
		User freelancer = CreateFreelancerUser(freelancerId);
		DateTime proposalCreatedAt = DateTime.UtcNow.AddHours(-2);
		DateTime secondProposalCreatedAt = DateTime.UtcNow.AddHours(-1);

		var order = new Order
		{
			Id = id,
			CustomerId = customerId,
			Customer = customer,
			FreelancerId = freelancerId,
			Freelancer = freelancer,
			Title = "Landing page for SaaS",
			Description = "Need a clean landing page with clear CTA and responsive layout.",
			TechnicalSpecification = "React + ASP.NET Core, responsive design, SEO basics.",
			MinPrice = 1000,
			MaxPrice = 2000,
			Currency = Currency.USD,
			Payment = Payment.Fixed,
			Skills = new List<string> { "React", "ASP.NET Core", "SEO" },
			Category = Category.Development,
			Status = OrderStatus.Published,
			WorkflowStage = WorkflowStage.review,
			AiGenerated = true,
			ReadinessScore = 85,
			ClientApproved = true,
			FreelancerApproved = false,
			ClientDoneApproved = false,
			FreelancerDoneApproved = true,
			ClientRatingByFreelancer = 5,
			FreelancerRatingByClient = 4,
			CreatedAt = DateTime.UtcNow.AddDays(-3),
			UpdatedAt = DateTime.UtcNow.AddHours(-3),
			PublishedAt = DateTime.UtcNow.AddDays(-2),
			CompletedAt = null,
			BriefSections = CreateOrderBriefSections(id),
			ClarificationQuestions = new List<ClarificationQuestion>
			{
				CreateClarificationQuestion(orderId: id)
			},
			ScopeItems = new List<ScopeItem>
			{
				CreateScopeItem(orderId: id)
			},
			DoneCriteria = new List<DoneCriterion>
			{
				CreateDoneCriterion(orderId: id)
			},
			Risks = new List<RiskItem>
			{
				CreateRiskItem(orderId: id)
			},
			Proposals = new List<Proposal>
			{
				CreateProposal(orderId: id, freelancerId: freelancerId, createdAtUtc: proposalCreatedAt),
				CreateProposal(orderId: id, freelancerId: freelancerId, proposalId: 2, createdAtUtc: secondProposalCreatedAt)
			}
		};

		foreach (ClarificationQuestion question in order.ClarificationQuestions)
		{
			question.Order = order;
		}

		foreach (ScopeItem scopeItem in order.ScopeItems)
		{
			scopeItem.Order = order;
		}

		foreach (DoneCriterion doneCriterion in order.DoneCriteria)
		{
			doneCriterion.Order = order;
		}

		foreach (RiskItem riskItem in order.Risks)
		{
			riskItem.Order = order;
		}

		foreach (Proposal proposal in order.Proposals)
		{
			proposal.Order = order;
		}

		order.BriefSections!.Order = order;

		return order;
	}

	private static OrderListItemDto CreateExpectedOrderDto(Order order)
	{
		string description = order.Description ?? string.Empty;
		List<Proposal> proposals = order.Proposals ?? new();
		List<ClarificationQuestion> clarificationQuestions = order.ClarificationQuestions ?? new();
		List<ScopeItem> scopeItems = order.ScopeItems ?? new();
		List<DoneCriterion> doneCriteria = order.DoneCriteria ?? new();
		List<RiskItem> risks = order.Risks ?? new();

		return new OrderListItemDto
		{
			Id = order.Id,
			HirerId = order.CustomerId,
			HirerName = order.Customer?.FullName ?? string.Empty,
			CompanyName = order.Customer?.CompanyName ?? string.Empty,
			HirerRating = order.Customer?.Rating ?? 0,
			SelectedFreelancerId = order.FreelancerId,
			SelectedFreelancerName = order.Freelancer?.FullName,
			SelectedFreelancerRating = order.Freelancer?.Rating,
			Title = order.Title,
			ShortDescription = description.Length > 150
				? description.Substring(0, 150)
				: description,
			RawDescription = description,
			TechnicalSpecification = order.TechnicalSpecification,
			Category = order.Category,
			BudgetMin = order.MinPrice,
			BudgetMax = order.MaxPrice,
			Currency = order.Currency,
			BudgetType = order.Payment,
			Skills = order.Skills ?? new List<string>(),
			Status = order.Status,
			WorkflowStage = order.WorkflowStage,
			ProposalsCount = proposals.Count,
			Proposals = proposals
				.OrderByDescending(proposal => proposal.CreatedAt)
				.Select(proposal => new ProjectProposalDto
				{
					Id = proposal.Id,
					ProjectId = proposal.OrderId,
					FreelancerId = proposal.FreelancerId,
					FreelancerName = proposal.Freelancer?.FullName ?? string.Empty,
					Message = proposal.Message,
					Price = proposal.Price,
					Currency = proposal.Currency,
					EstimatedDays = proposal.EstimatedDays,
					Status = proposal.Status,
					CreatedAt = proposal.CreatedAt
				})
				.ToList(),
			PublishedAt = order.PublishedAt,
			CompletedAt = order.CompletedAt,
			UpdatedAt = order.UpdatedAt,
			AiGenerated = order.AiGenerated,
			ClientDoneApproved = order.ClientDoneApproved,
			FreelancerDoneApproved = order.FreelancerDoneApproved,
			ReadinessScore = order.ReadinessScore,
			BriefSections = new BriefSectionsDto
			{
				Goal = order.BriefSections?.Goal ?? string.Empty,
				Audience = order.BriefSections?.Audience ?? string.Empty,
				Screens = order.BriefSections?.Screens ?? string.Empty,
				Features = order.BriefSections?.Features ?? string.Empty,
				Content = order.BriefSections?.Content ?? string.Empty,
				Design = order.BriefSections?.Design ?? string.Empty,
				Constraints = order.BriefSections?.Constraints ?? string.Empty,
				OpenQuestions = order.BriefSections?.OpenQuestions ?? string.Empty
			},
			ClarificationQuestions = clarificationQuestions
				.Select(question => new ClarificationQuestionDto
				{
					Id = question.Id,
					Question = question.Question,
					Importance = question.Importance,
					Answer = question.Answer,
					Options = question.Options ?? new List<string>()
				})
				.ToList(),
			ScopeItems = scopeItems
				.Select(scopeItem => new ScopeItemDto
				{
					Id = scopeItem.Id,
					Title = scopeItem.Title,
					Description = scopeItem.Description,
					Bucket = scopeItem.Bucket
				})
				.ToList(),
			DoneCriteria = doneCriteria
				.Select(doneCriterion => new DoneCriterionDto
				{
					Id = doneCriterion.Id,
					Text = doneCriterion.Text,
					Checked = doneCriterion.Checked
				})
				.ToList(),
			Risks = risks
				.Select(risk => new RiskItemDto
				{
					Id = risk.Id,
					Title = risk.Title,
					Level = risk.Level,
					Impact = risk.Impact,
					Action = risk.Action,
					Resolved = risk.Resolved
				})
				.ToList(),
			Approvals = new ApprovalsDto
			{
				Client = order.ClientApproved,
				Freelancer = order.FreelancerApproved
			},
			ClientRatingByFreelancer = order.ClientRatingByFreelancer,
			FreelancerRatingByClient = order.FreelancerRatingByClient
		};
	}

	private static CreateOrderRequest CreateOrderRequest()
	{
		return new CreateOrderRequest
		{
			Title = "Landing page for SaaS",
			RawDescription = "Need a clean landing page with clear CTA and responsive layout.",
			TechnicalSpecification = "React + ASP.NET Core, responsive design, SEO basics.",
			Category = Category.Development,
			BudgetMin = 1000,
			BudgetMax = 2000,
			Currency = Currency.USD,
			BudgetType = Payment.Fixed,
			Skills = new List<string> { "React", "ASP.NET Core", "SEO" },
			AiGenerated = true,
			ReadinessScore = 85,
			BriefSections = CreateBriefSectionsRequest(),
			ClarificationQuestions = new List<ClarificationQuestionRequest>
			{
				CreateClarificationQuestionRequest()
			},
			ScopeItems = new List<ScopeItemRequest>
			{
				CreateScopeItemRequest()
			},
			DoneCriteria = new List<DoneCriterionRequest>
			{
				CreateDoneCriterionRequest()
			},
			Risks = new List<RiskItemRequest>
			{
				CreateRiskItemRequest()
			},
			CompanyName = "Test Client LLC"
		};
	}

	private static UpdateOrderRequest CreateUpdateOrderRequest()
	{
		return new UpdateOrderRequest
		{
			Title = "Updated landing page for SaaS",
			RawDescription = "Updated description with clarified scope and launch expectations.",
			TechnicalSpecification = "React + ASP.NET Core, responsive design, analytics, SEO basics.",
			Category = Category.Development,
			BudgetMin = 1200,
			BudgetMax = 2400,
			Currency = Currency.USD,
			BudgetType = Payment.Fixed,
			Skills = new List<string> { "React", "ASP.NET Core", "Analytics" },
			Status = OrderStatus.Published,
			WorkflowStage = WorkflowStage.review,
			AiGenerated = true,
			ReadinessScore = 90,
			BriefSections = CreateBriefSectionsRequest(),
			ClarificationQuestions = new List<ClarificationQuestionRequest>
			{
				CreateClarificationQuestionRequest()
			},
			ScopeItems = new List<ScopeItemRequest>
			{
				CreateScopeItemRequest()
			},
			DoneCriteria = new List<DoneCriterionRequest>
			{
				CreateDoneCriterionRequest()
			},
			Risks = new List<RiskItemRequest>
			{
				CreateRiskItemRequest()
			},
			CompanyName = "Updated Client LLC"
		};
	}

	private static CreateProposalRequest CreateProposalRequest(int orderId = 1)
	{
		return new CreateProposalRequest
		{
			OrderId = orderId,
			Price = 1500,
			Message = "I can deliver the landing page with responsive layout, SEO basics and clean code within the requested timeframe.",
			EstimatedDays = 7
		};
	}

	private static UpdateApprovalRequest CreateUpdateApprovalRequest(bool approved = true)
	{
		return new UpdateApprovalRequest
		{
			Approved = approved
		};
	}

	private static UpdateClarificationQuestionsRequest CreateUpdateClarificationQuestionsRequest()
	{
		return new UpdateClarificationQuestionsRequest
		{
			ClarificationQuestions = new List<ClarificationQuestionRequest>
			{
				CreateClarificationQuestionRequest()
			}
		};
	}

	private static UpdateOrderRatingRequest CreateUpdateOrderRatingRequest(int score = 5)
	{
		return new UpdateOrderRatingRequest
		{
			Score = score
		};
	}

	private static BriefSectionsRequest CreateBriefSectionsRequest()
	{
		return new BriefSectionsRequest
		{
			Goal = "Increase demo requests from the landing page.",
			Audience = "B2B founders and startup teams.",
			Screens = "Hero, benefits, testimonials, pricing, CTA.",
			Features = "Responsive layout, form, analytics hooks.",
			Content = "Marketing copy and trust blocks.",
			Design = "Modern clean visual style.",
			Constraints = "Launch in two weeks.",
			OpenQuestions = "Need final copy approval."
		};
	}

	private static ClarificationQuestionRequest CreateClarificationQuestionRequest(int id = 1)
	{
		return new ClarificationQuestionRequest
		{
			id = id,
			Question = "Should the landing page support two languages?",
			Importance = RiskLevel.medium,
			Answer = "English only for the first release.",
			Options = new List<string> { "English only", "English and Russian" }
		};
	}

	private static ScopeItemRequest CreateScopeItemRequest(int id = 1)
	{
		return new ScopeItemRequest
		{
			Id = id,
			Title = "Landing page UI",
			Description = "Build all public landing page sections.",
			Bucket = ScopeBucket.included
		};
	}

	private static DoneCriterionRequest CreateDoneCriterionRequest(int id = 1)
	{
		return new DoneCriterionRequest
		{
			Id = id,
			Text = "Responsive layout works on desktop and mobile.",
			Checked = true
		};
	}

	private static RiskItemRequest CreateRiskItemRequest(int id = 1)
	{
		return new RiskItemRequest
		{
			Id = id,
			Title = "Late content delivery",
			Level = RiskLevel.medium,
			Impact = "Can delay QA and final release.",
			Action = "Prepare placeholder copy early.",
			Resolved = false
		};
	}

	private static User CreateClientUser(int id)
	{
		User user = ProfileTestData.CreateClientUser(id);
		user.CompanyName = "Test Client LLC";
		return user;
	}

	private static User CreateFreelancerUser(int id)
	{
		return ProfileTestData.CreateFreelancerUser(id);
	}

	private static OrderBriefSections CreateOrderBriefSections(int orderId, int id = 1)
	{
		BriefSectionsRequest request = CreateBriefSectionsRequest();

		return new OrderBriefSections
		{
			Id = id,
			OrderId = orderId,
			Goal = request.Goal,
			Audience = request.Audience,
			Screens = request.Screens,
			Features = request.Features,
			Content = request.Content,
			Design = request.Design,
			Constraints = request.Constraints,
			OpenQuestions = request.OpenQuestions
		};
	}

	private static ClarificationQuestion CreateClarificationQuestion(int orderId, int id = 1)
	{
		ClarificationQuestionRequest request = CreateClarificationQuestionRequest(id);

		return new ClarificationQuestion
		{
			Id = id,
			OrderId = orderId,
			Question = request.Question,
			Importance = request.Importance,
			Answer = request.Answer,
			Options = request.Options
		};
	}

	private static ScopeItem CreateScopeItem(int orderId, int id = 1)
	{
		ScopeItemRequest request = CreateScopeItemRequest(id);

		return new ScopeItem
		{
			Id = id,
			OrderId = orderId,
			Title = request.Title,
			Description = request.Description,
			Bucket = request.Bucket
		};
	}

	private static DoneCriterion CreateDoneCriterion(int orderId, int id = 1)
	{
		DoneCriterionRequest request = CreateDoneCriterionRequest(id);

		return new DoneCriterion
		{
			Id = id,
			OrderId = orderId,
			Text = request.Text,
			Checked = request.Checked
		};
	}

	private static RiskItem CreateRiskItem(int orderId, int id = 1)
	{
		RiskItemRequest request = CreateRiskItemRequest(id);

		return new RiskItem
		{
			Id = id,
			OrderId = orderId,
			Title = request.Title,
			Level = request.Level,
			Impact = request.Impact,
			Action = request.Action,
			Resolved = request.Resolved
		};
	}

	private static Proposal CreateProposal(
		int orderId,
		int freelancerId,
		int proposalId = 1,
		DateTime? createdAtUtc = null)
	{
		return new Proposal
		{
			Id = proposalId,
			OrderId = orderId,
			FreelancerId = freelancerId,
			Freelancer = CreateFreelancerUser(freelancerId),
			Price = 1500,
			Currency = Currency.USD,
			EstimatedDays = 7,
			Status = ProposalStatus.pending,
			Message = "I can deliver the landing page with responsive layout and clean code.",
			CreatedAt = createdAtUtc ?? DateTime.UtcNow
		};
	}
}
