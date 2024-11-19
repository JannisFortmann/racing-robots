#[derive(clap::Parser)]
#[clap(version)]
pub struct Args {
	#[clap(long, default_value_t=true, action=clap::ArgAction::Set)]
	animate: bool,
	board: std::path::PathBuf,
}

fn main() {
	let args: Args = clap::Parser::parse();

	let f = std::fs::File::open(args.board).unwrap();
	let mut input = std::io::BufReader::new(f);

	let game = ricochetrobots::parse(&mut input).unwrap();
	eprintln!("Starting Board:");
	eprintln!("{:?}", game);

	let start = std::time::Instant::now();
	let solution = ricochetrobots::solve(game);
	let elapsed = start.elapsed();

	if args.animate {
		eprintln!("Solved in {:?}", elapsed);
	}

	for (i, step) in solution.into_iter().enumerate() {
		if args.animate {
			std::thread::sleep(std::time::Duration::from_millis(600));
		}
		eprintln!("Step {}: Robot {} moves {}", i + 1, step.robot.as_u8() + 1, step.direction);
		eprintln!("{:?}", step.resulting_game());
	}

	solution.serialize(&mut std::io::stdout()).unwrap();

	eprintln!("Solved in {:?}", elapsed);
}
