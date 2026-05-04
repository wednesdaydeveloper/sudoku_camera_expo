require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SudokuDetector'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = { :type => 'MIT' }
  s.authors        = { 'wednesdaydeveloper' => 'sigaokamoto@gmail.com' }
  s.homepage       = 'https://github.com/wednesdaydeveloper/sudoku_camera_expo'
  s.platforms      = { :ios => '15.5' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{swift,h,m}'
  s.swift_version = '5.4'

  s.frameworks = 'Vision', 'UIKit'
end
