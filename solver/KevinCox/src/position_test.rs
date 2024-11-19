#[test]
fn test() {
	assert_eq!(crate::Position::new(2, 5).xy(), (2, 5));
	assert_eq!(crate::Position::new(15, 15).xy(), (15, 15));
}
