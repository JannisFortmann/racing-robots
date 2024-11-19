use std::io::Read;

pub fn scan_dir(dir: &str) -> Box<dyn Iterator<Item=std::path::PathBuf>> {
	let dir = format!("tests/{}", dir);

	if let Some(file) = std::env::args().nth(1) {
		let file = std::path::PathBuf::from(file);
		return Box::new(Some(file).into_iter())
	}

	Box::new(std::fs::read_dir(dir).unwrap().map(|f| f.unwrap().path()))
}

pub fn test_dir<
	F: std::panic::RefUnwindSafe + Fn(&std::path::Path) -> ()>
	(dir: &str, f: F)
{
	let mut tests = 0;
	let mut errors = 0;

	for path in scan_dir(dir) {
		println!("Testing {:?}", path);
		tests += 1;
		if let Err(_) = std::panic::catch_unwind(|| f(&path)) {
			errors += 1;
			println!("Error testing {:?}", path);
		}
	}

	if tests == 0 {
		panic!("No tests run.");
	}

	if errors == 0 {
		eprintln!("{} tests completed successfully.", tests);
	} else {
		eprintln!("{}/{} tests failed.", errors, tests);
		std::process::exit(1)
	}
}

fn main() {
	test_dir("solutions", |path| {
		let f = std::fs::File::open(path).unwrap();
		let mut input = std::io::BufReader::new(f);
		let game = ricochetrobots::parse(&mut input).unwrap();

		let mut solution = String::new();
		input.read_to_string(&mut solution).unwrap();

		let mut moves = Vec::new();
		ricochetrobots::solve(game).serialize(&mut moves).unwrap();
		let moves = String::from_utf8(moves).unwrap();

		if moves != solution {
			let changes = difference::Changeset::new(&solution, &moves, "\n");
			print!("{}", changes);
			std::env::remove_var("RUST_BACKTRACE");
			panic!("ERROR: Difference found in {:?}", path);
		}
	})
}
