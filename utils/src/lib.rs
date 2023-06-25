#![deny(clippy::all)]
#[macro_use]
extern crate napi_derive;
use napi::bindgen_prelude::Result;
use std::{fs::*, io::*, time::*};
#[napi]
struct Logger {
  file: File,
}
#[napi]
impl Logger {
  #[napi(constructor)]
  pub fn new() -> Result<Self> {
    Ok(Self {
      file: File::options()
        .append(true)
        .create(true)
        .read(true)
        .open("log")?,
    })
  }
  #[napi]
  pub fn debug(&self, message: String) -> Result<()> {
    write_log(message, &self.file)
  }
  #[napi]
  pub fn error(&mut self, message: String) -> Result<()> {
    eprintln!("\x07\x1b[31m{}", message);
    self.file.write_all(b"\xE2\x9A\xA0")?;
    write_log(message, &self.file)
  }
}
const START: SeekFrom = SeekFrom::Start(0);
///Append message to file `file` in the format `{current timestamp in ms}: {message}`. Remove any logs previously written where the timestamp, taken by up to 16 digits from the start of each line, is logged as less than one day ago.
fn write_log(message: String, mut file: &File) -> Result<()> {
  let now = SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap()
    .as_millis() as u64;
  writeln!(file, "{now}: {message}")?;
  file.seek(START)?;
  let mut reader = BufReader::new(file);
  let mut line = String::new();
  let day_ago = now - 86400000;
  loop {
    if reader.read_line(&mut line)? == 0 {
      return Ok(());
    };
    let mut checked = false;
    let timestamp = line
      .chars()
      .take(16)
      .skip_while(|&c| {
        if checked {
          return true;
        }
        checked = true;
        c == '⚠'
      })
      .map_while(|c| c.to_digit(10))
      .fold(0, |a, digit| a * 10 + digit as u64);
    if timestamp > day_ago {
      break;
    }
    line.clear();
  }
  let mut contents = vec![];
  reader.read_to_end(&mut contents)?;
  let mut file = reader.into_inner();
  file.set_len(0)?;
  file.seek(START)?;
  write!(file, "{line}")?;
  file.write_all(&contents)?;
  Ok(())
}
