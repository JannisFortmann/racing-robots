#[derive(clap::Parser)]
#[clap(version)]
pub struct Args {
	#[clap(long, short)]
	color: Option<ricochetrobots::Robot>,
	
	board: std::path::PathBuf,
}

fn main() {
	let args: Args = clap::Parser::parse();

	let f = std::fs::File::open(args.board).unwrap();
	let mut input = std::io::BufReader::new(f);
	let mut game = ricochetrobots::parse(&mut input).unwrap();
	let board = game.board();

	let color = args.color
		.or(game.target.robot)
		.unwrap_or(ricochetrobots::Robot::BLACK);

	let precompute = ricochetrobots::Precompute::new(&game);

	eprintln!("{}", ricochetrobots::BoardFmt{
		board: &board,
		cell_width: 4,
		cell_fmt: |pos, f| {
			let score = precompute.get_basic_minimum_distance(color, pos);
			if let Some(mirror) = board.mirror(pos) {
				write!(f, " {}  ", mirror)
			} else if score == u8::max_value() {
				write!(f, "    ")
			} else if score == 0 {
				write!(f, " {}  ", game.target)
			} else {
				write!(f, "{:^4x}", score)
			}
		},
	});

	eprintln!("Minimum moves to solve: {}", precompute.estimate(&mut game))
}
