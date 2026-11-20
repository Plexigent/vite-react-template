// macOS-only asset authoring tool. No runtime website dependency.
// Run from repository root: swift -module-cache-path /tmp/plexigent-swift-cache scripts/generate-brand-assets.swift
import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

let source = URL(fileURLWithPath: "src/react-app/experience/geometry.json")
let geometry = try JSONSerialization.jsonObject(with: Data(contentsOf: source)) as! [String: Any]
let nodes = geometry["butterfly"] as! [[String: Any]]
let details = geometry["details"] as! [[String: Any]]
let edges = geometry["edges"] as! [[Int]]
func number(_ object: [String: Any], _ key: String) -> Double { (object[key] as! NSNumber).doubleValue }
func point(_ node: [String: Any], _ x: String = "x", _ y: String = "y") -> CGPoint {
    CGPoint(x: (number(node,x)-78.3)*16, y: (number(node,y)-23.4)*9)
}
let points = nodes.map { point($0) }
let allPoints = points + details.flatMap { [point($0),point($0,"x2","y2")] }
let minX = allPoints.map(\.x).min()!-8, maxX = allPoints.map(\.x).max()!+8
let minY = allPoints.map(\.y).min()!-8, maxY = allPoints.map(\.y).max()!+8
func lineSVG(_ a: CGPoint, _ b: CGPoint, _ opacity: Double) -> String {
    "<path d=\"M\(a.x) \(a.y)L\(b.x) \(b.y)\" opacity=\"\(opacity)\"/>"
}
var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"\(minX) \(minY) \(maxX-minX) \(maxY-minY)\" role=\"img\" aria-label=\"Plexigent connected-dot butterfly\"><g fill=\"none\" stroke=\"#80dbe5\" stroke-width=\"1\">"
for edge in edges { svg += lineSVG(points[edge[0]],points[edge[1]],0.52) }
for detail in details { svg += lineSVG(point(detail),point(detail,"x2","y2"),(detail["opacity"] as? Double ?? 0.5)*0.9) }
svg += "</g><g fill=\"#e0fcff\">"
for (i,node) in nodes.enumerated() { svg += "<circle cx=\"\(points[i].x)\" cy=\"\(points[i].y)\" r=\"\(max(1.15,number(node,"size")*4))\" opacity=\"\(number(node,"opacity"))\"/>" }
svg += "</g></svg>\n"
try svg.write(toFile:"public/plexigent-connected-butterfly.svg",atomically:true,encoding:.utf8)

let space = CGColorSpaceCreateDeviceRGB()
let ctx = CGContext(data:nil,width:1200,height:630,bitsPerComponent:8,bytesPerRow:0,space:space,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
func color(_ r: CGFloat,_ g: CGFloat,_ b: CGFloat,_ a: CGFloat = 1) -> CGColor { CGColor(red:r/255,green:g/255,blue:b/255,alpha:a) }
ctx.setFillColor(color(7,11,16)); ctx.fill(CGRect(x:0,y:0,width:1200,height:630))
ctx.saveGState(); ctx.translateBy(x:660,y:380); ctx.scaleBy(x:1,y:-1)
ctx.setStrokeColor(color(128,219,229)); ctx.setLineWidth(1)
func line(_ a: CGPoint, _ b: CGPoint, _ alpha: Double) { ctx.setAlpha(alpha); ctx.beginPath(); ctx.move(to:a); ctx.addLine(to:b); ctx.strokePath() }
for edge in edges { line(points[edge[0]],points[edge[1]],0.52) }
for detail in details { line(point(detail),point(detail,"x2","y2"),(detail["opacity"] as? Double ?? 0.5)*0.9) }
ctx.setFillColor(color(224,252,255))
for (i,node) in nodes.enumerated() { let r=max(1.15,number(node,"size")*4); ctx.setAlpha(number(node,"opacity")); ctx.fillEllipse(in:CGRect(x:points[i].x-r,y:points[i].y-r,width:2*r,height:2*r)) }
ctx.restoreGState()
func text(_ value: String, _ y: CGFloat, _ size: CGFloat, _ color: CGColor) {
    let font=CTFontCreateWithName("ArialMT" as CFString,size,nil)
    let attrs=[kCTFontAttributeName:font,kCTForegroundColorAttributeName:color] as CFDictionary
    let line=CTLineCreateWithAttributedString(CFAttributedStringCreate(nil,value as CFString,attrs))
    let width=CTLineGetTypographicBounds(line,nil,nil,nil)
    let originX=(1200-width)/2
    ctx.textPosition=CGPoint(x:originX,y:y); CTLineDraw(line,ctx)
    if value == "Plexigent" {
        for index in [3,4] {
            var character=Array(value.utf16)[index], glyph=CGGlyph()
            CTFontGetGlyphsForCharacters(font,&character,&glyph,1)
            guard let outline=CTFontCreatePathForGlyph(font,glyph,nil) else { continue }
            let bounds=outline.boundingBoxOfPath
            let offset=CTLineGetOffsetForStringIndex(line,index,nil)
            ctx.saveGState(); ctx.translateBy(x:originX+offset,y:y)
            ctx.addPath(outline); ctx.clip(); ctx.setFillColor(CGColor(red:76/255,green:226/255,blue:242/255,alpha:1))
            if index == 3 {
                // Only the forward / stroke of x.
                ctx.beginPath(); ctx.move(to:CGPoint(x:bounds.minX,y:bounds.minY))
                ctx.addLine(to:CGPoint(x:bounds.minX+bounds.width*0.31,y:bounds.minY))
                ctx.addLine(to:CGPoint(x:bounds.maxX,y:bounds.maxY))
                ctx.addLine(to:CGPoint(x:bounds.maxX-bounds.width*0.31,y:bounds.maxY)); ctx.closePath(); ctx.fillPath()
            } else {
                // Only the dot of i; the stem remains neutral.
                ctx.fill(CGRect(x:bounds.minX,y:bounds.maxY-size*0.18,width:bounds.width,height:size*0.18))
            }
            ctx.restoreGState()
        }
    }
}
text("Plexigent",170,76,color(241,244,245))
text("Connecting Dots",123,18,color(162,174,181))
let destination=CGImageDestinationCreateWithURL(URL(fileURLWithPath:"public/plexigent-social.png") as CFURL,UTType.png.identifier as CFString,1,nil)!
CGImageDestinationAddImage(destination,ctx.makeImage()!,nil)
precondition(CGImageDestinationFinalize(destination))
print("Wrote connected-dot SVG and 1200×630 sharing image from original geometry.")
