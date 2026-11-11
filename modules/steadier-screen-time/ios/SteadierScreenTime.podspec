Pod::Spec.new do |s|
 s.name = 'SteadierScreenTime'
 s.version = '0.1.0'
 s.summary = 'On-device Screen Time authorization for Steadier'
 s.description = s.summary
 s.license = { :type => 'MIT' }
 s.author = 'Steadier'
 s.homepage = 'https://github.com/ima-o3/steadier'
 s.platforms = { :ios => '16.0' }
 s.source = { :git => 'https://github.com/ima-o3/steadier.git' }
 s.static_framework = true
 s.dependency 'ExpoModulesCore'
 s.source_files = '**/*.swift'
 s.swift_version = '5.0'
end

