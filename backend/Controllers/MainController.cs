using backend;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace
{
    [Route("api/v1/main")]
    [ApiController]
    public class MainController : ControllerBase
    {
        private readonly AppDbContext _db;
        public MainController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("user-count")]
        public async Task<IActionResult> GetCountUser()
        {
            int count = await _db.Users.CountAsync();

            return Ok(count);
        }
        [HttpGet("project-type-count")]
        public async Task<IActionResult> GetCountProject([FromQuery] Category category)
        {
            int count = await _db.Orders
                .Where(order => order.Category == category)
                .CountAsync();

            return Ok(count);
        }
    }
}
