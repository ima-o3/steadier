import importlib.util
import json
from pathlib import Path
import plistlib
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('packager', Path(__file__).parents[1] / 'package-unsigned-ipa.py')
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class PackageTests(unittest.TestCase):
    def setUp(self):
        cache = Path(__file__).resolve().parents[2] / '.test-cache'
        cache.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=cache)
        self.root = Path(self.temp.name)
        self.app = self.root / 'Steadier.app'
        self.app.mkdir()
        self.info = {'CFBundleSupportedPlatforms': ['iPhoneOS'], 'CFBundleExecutable': 'Steadier', 'CFBundleIdentifier': 'com.ima03.steadier', 'CFBundleShortVersionString': '0.1.7', 'CFBundleVersion': '8'}
        self.write_info()
        (self.app / 'Steadier').write_bytes(b'test-fixture-not-a-real-executable')
        (self.app / 'main.jsbundle').write_bytes(b'fixture')
        self.output = self.root / 'output' / 'Steadier.ipa'

    def tearDown(self):
        self.temp.cleanup()

    def write_info(self):
        (self.app / 'Info.plist').write_bytes(plistlib.dumps(self.info))

    def test_packages_release_bundle_and_checksum(self):
        result = packager.package_app(self.app, self.output)
        with zipfile.ZipFile(self.output) as archive:
            self.assertIn('Payload/Steadier.app/main.jsbundle', archive.namelist())
            self.assertIn('Payload/Steadier.app/Steadier', archive.namelist())
        self.assertFalse(result['signed'])
        self.assertEqual(result['version'], '0.1.7')
        self.assertEqual(result['buildNumber'], '8')
        self.assertEqual(len(result['sha256']), 64)
        self.assertEqual(json.loads((self.output.parent / 'build-info.json').read_text())['platform'], 'iPhoneOS')

    def test_rejects_simulator_app(self):
        self.info['CFBundleSupportedPlatforms'] = ['iPhoneSimulator']
        self.write_info()
        with self.assertRaisesRegex(ValueError, 'physical iPhone'):
            packager.package_app(self.app, self.output)

    def test_rejects_missing_embedded_javascript(self):
        (self.app / 'main.jsbundle').unlink()
        with self.assertRaisesRegex(ValueError, 'embedded JavaScript'):
            packager.package_app(self.app, self.output)

    def test_rejects_unexpected_provisioning(self):
        (self.app / 'embedded.mobileprovision').write_text('unexpected')
        with self.assertRaisesRegex(ValueError, 'provisioning'):
            packager.package_app(self.app, self.output)


if __name__ == '__main__':
    unittest.main()
