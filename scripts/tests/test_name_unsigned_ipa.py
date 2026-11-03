import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('namer', Path(__file__).parents[1] / 'name-unsigned-ipa.py')
namer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(namer)


class NameIpaTests(unittest.TestCase):
    def setUp(self):
        cache = Path(__file__).resolve().parents[2] / '.test-cache'
        cache.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=cache)
        self.folder = Path(self.temp.name)
        self.digest = 'a' * 64
        (self.folder / 'build-info.json').write_text(json.dumps({
            'version': '0.1.7', 'buildNumber': '8', 'sha256': self.digest,
        }), encoding='utf-8')
        (self.folder / 'Steadier-unsigned.ipa').write_bytes(b'fixture')
        (self.folder / 'Steadier-unsigned.ipa.sha256').write_text('old-name', encoding='utf-8')

    def tearDown(self):
        self.temp.cleanup()

    def test_uses_compiled_app_version_for_ipa_and_github_artifact(self):
        output = self.folder / 'output.txt'
        name, new = namer.rename_ipa(self.folder, output)
        self.assertEqual(name, 'Steadier-v0.1.7-build8-unsigned-iphone')
        self.assertEqual(new.name, 'Steadier-v0.1.7-build8-unsigned.ipa')
        self.assertEqual(new.read_bytes(), b'fixture')
        self.assertEqual((self.folder / f'{new.name}.sha256').read_text(), f'{self.digest}  {new.name}\n')
        self.assertIn(f'artifact_name={name}', output.read_text())
        self.assertFalse((self.folder / 'Steadier-unsigned.ipa').exists())

    def test_rejects_bad_compiled_version_without_renaming(self):
        (self.folder / 'build-info.json').write_text(json.dumps({
            'version': '../bad', 'buildNumber': '8', 'sha256': self.digest,
        }), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'version'):
            namer.rename_ipa(self.folder)
        self.assertTrue((self.folder / 'Steadier-unsigned.ipa').exists())

    def test_rejects_bad_build_number_without_renaming(self):
        (self.folder / 'build-info.json').write_text(json.dumps({
            'version': '0.1.7', 'buildNumber': 'eight', 'sha256': self.digest,
        }), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'build number'):
            namer.rename_ipa(self.folder)
        self.assertTrue((self.folder / 'Steadier-unsigned.ipa').exists())
